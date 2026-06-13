"""RiskClassifier — supervised flood/drought predictor (Fase 2).

Trains a calibrated HistGradientBoostingClassifier against real UNGRD/HDX/DesInventar
labels. The existing rule-based heuristic is used as a FEATURE (not as the target).

The model must beat the heuristic baseline — this is validated during training.

Persistence:
    backend/app/ml/data/risk_classifier_{event_type}.joblib
    backend/app/ml/data/risk_feature_names_{event_type}.json
"""
import json
import logging
from pathlib import Path

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import average_precision_score, brier_score_loss

logger = logging.getLogger(__name__)

_MODEL_DIR = Path(__file__).parent / "data"
_MODEL_DIR.mkdir(parents=True, exist_ok=True)


def _model_path(event_type: str) -> Path:
    return _MODEL_DIR / f"risk_classifier_{event_type}.joblib"


def _feat_path(event_type: str) -> Path:
    return _MODEL_DIR / f"risk_feature_names_{event_type}.json"


# ── Training ─────────────────────────────────────────────────────────────────

def train(
    event_type: str = "flood",
    force_rebuild_dataset: bool = False,
) -> dict:
    """Train the RiskClassifier and persist the model.

    Returns a metrics dict with PR-AUC, Brier, and baseline comparison.
    """
    import joblib
    from app.ml.riesgo_climatico_dataset import build_dataset

    logger.info("Loading dataset for event_type=%s …", event_type)
    X_tr, y_tr, X_val, y_val, X_te, y_te, feat_names = build_dataset(
        event_type, force_rebuild=force_rebuild_dataset
    )

    if X_val.shape[0] == 0 or X_te.shape[0] == 0:
        raise RuntimeError(
            "Val or test split is empty. Run build_dataset(force_rebuild=True) first."
        )

    logger.info(
        "Dataset — train: %d | val: %d | test: %d | features: %d",
        len(y_tr), len(y_val), len(y_te), X_tr.shape[1],
    )

    # Combine train+val for final fit; use test for honest evaluation
    X_trainval = np.vstack([X_tr, X_val])
    y_trainval = np.concatenate([y_tr, y_val])

    # --- Baseline: heuristic_score column used as a single-feature classifier ---
    heuristic_idx = feat_names.index("heuristic_score") if "heuristic_score" in feat_names else None
    baseline_pr_auc = None
    if heuristic_idx is not None:
        h_scores = X_te[:, heuristic_idx]
        baseline_pr_auc = average_precision_score(y_te, h_scores)
        logger.info("Heuristic baseline PR-AUC (test): %.4f", baseline_pr_auc)

    # --- Train GBM on train set ---
    gbm = HistGradientBoostingClassifier(
        max_iter=400,
        learning_rate=0.05,
        max_depth=6,
        min_samples_leaf=20,
        class_weight="balanced",
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=20,
        random_state=42,
    )
    gbm.fit(X_tr, y_tr)
    logger.info("GBM fitted — iterations used: %d", gbm.n_iter_)

    # Calibrate with isotonic regression on temporal val set (2017-2019)
    # This is the correct approach for temporal data: no cross-validation leakage
    raw_val_proba = gbm.predict_proba(X_val)[:, 1]
    calibrator = IsotonicRegression(out_of_bounds="clip")
    calibrator.fit(raw_val_proba, y_val)

    # Composite predictor: GBM scores → isotonic calibration
    class _CalibratedGBM:
        def __init__(self, base, cal):
            self._base = base
            self._cal = cal
        def predict_proba(self, X):
            raw = self._base.predict_proba(X)[:, 1]
            calib = self._cal.predict(raw)
            return np.column_stack([1 - calib, calib])
        @property
        def feature_importances_(self):
            return self._base.feature_importances_
        @property
        def n_iter_(self):
            return self._base.n_iter_

    clf = _CalibratedGBM(gbm, calibrator)

    # --- Evaluate on held-out test set ---
    proba_te = clf.predict_proba(X_te)[:, 1]
    pr_auc_te = average_precision_score(y_te, proba_te)
    brier_te = brier_score_loss(y_te, proba_te)

    # Recall at precision >= 0.9 (operational threshold)
    from sklearn.metrics import precision_recall_curve
    prec, rec, _ = precision_recall_curve(y_te, proba_te)
    mask = prec >= 0.90
    recall_at_p90 = float(rec[mask].max()) if mask.any() else 0.0

    logger.info(
        "RiskClassifier — PR-AUC: %.4f | Brier: %.4f | Recall@P90: %.4f",
        pr_auc_te, brier_te, recall_at_p90,
    )

    if baseline_pr_auc is not None and pr_auc_te <= baseline_pr_auc:
        logger.warning(
            "MODEL DOES NOT BEAT HEURISTIC BASELINE (%.4f vs %.4f). "
            "Consider more data or feature engineering.",
            pr_auc_te, baseline_pr_auc,
        )
    elif baseline_pr_auc is not None:
        improvement = (pr_auc_te - baseline_pr_auc) / baseline_pr_auc * 100
        logger.info("Beats heuristic by +%.1f%% PR-AUC", improvement)

    # Feature importances via permutation on val set (HGBC has no built-in importances)
    top_features = []
    try:
        from sklearn.inspection import permutation_importance
        perm = permutation_importance(
            gbm, X_val, y_val, n_repeats=5,
            scoring="average_precision", random_state=42, n_jobs=-1,
        )
        ranked = sorted(
            zip(feat_names, perm.importances_mean.tolist()),
            key=lambda x: -x[1],
        )
        top_features = [{"feature": f, "importance": round(v, 4)} for f, v in ranked[:10]]
        logger.info("Top 5 features: %s", ranked[:5])
    except Exception as e:
        logger.warning("Could not compute permutation importance: %s", e)

    metrics = {
        "event_type": event_type,
        "test_pr_auc": round(pr_auc_te, 4),
        "test_brier": round(brier_te, 4),
        "test_recall_at_p90": round(recall_at_p90, 4),
        "baseline_pr_auc": round(baseline_pr_auc, 4) if baseline_pr_auc else None,
        "beats_baseline": (pr_auc_te > baseline_pr_auc) if baseline_pr_auc else None,
        "n_train": int(len(y_tr)),
        "n_val": int(len(y_val)),
        "n_test": int(len(y_te)),
        "n_features": int(X_tr.shape[1]),
        "gbm_iterations": int(gbm.n_iter_),
        "top_features": top_features,
    }

    # Persist components: GBM + calibrator separately
    joblib.dump({"gbm": gbm, "calibrator": calibrator}, _model_path(event_type))
    _feat_path(event_type).write_text(json.dumps(feat_names))
    logger.info("Model saved: %s", _model_path(event_type))

    return metrics


# ── Inference ─────────────────────────────────────────────────────────────────

class RiskClassifier:
    """Thin wrapper around the persisted GBM + isotonic calibrator."""

    def __init__(self, event_type: str = "flood"):
        import joblib
        path = _model_path(event_type)
        if not path.exists():
            raise FileNotFoundError(
                f"Model not found: {path}. Run riesgo_climatico_model.train('{event_type}') first."
            )
        bundle = joblib.load(path)
        self._gbm = bundle["gbm"]
        self._calibrator = bundle["calibrator"]
        feat_path = _feat_path(event_type)
        self._feat_names: list[str] = json.loads(feat_path.read_text()) if feat_path.exists() else []
        self._event_type = event_type

    @property
    def feature_names(self) -> list[str]:
        return self._feat_names

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Return calibrated probability of event for each sample. Shape: (n,)"""
        raw = self._gbm.predict_proba(X)[:, 1]
        return self._calibrator.predict(raw)

    def predict_from_coords(
        self,
        lat: float,
        lon: float,
        year: int,
        month: int,
    ) -> dict:
        """Build features from coordinates and return risk score + metadata."""
        from app.ml.riesgo_climatico_dataset import _build_feature_row
        row = _build_feature_row(lat, lon, year, month, self._event_type, label=0)
        if row is None:
            return {"probability": None, "error": "insufficient_chirps_coverage"}

        feat_values = np.array(
            [row.get(f, 0.0) for f in self._feat_names], dtype=np.float32
        ).reshape(1, -1)

        prob = float(self.predict_proba(feat_values)[0])
        return {
            "probability": round(prob, 4),
            "event_type": self._event_type,
            "features_used": len(self._feat_names),
        }


def is_trained(event_type: str = "flood") -> bool:
    return _model_path(event_type).exists()
