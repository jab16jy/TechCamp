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

from app.ml.riesgo_climatico_metrics import (
    DEFAULT_SEVERITY,
    decide_promotion,
    derive_severity_thresholds,
    pick_calibration_method,
    severity_breakdown,
    severity_label,
    threshold_matrix,
)

logger = logging.getLogger(__name__)

_MODEL_DIR = Path(__file__).parent / "data"
_MODEL_DIR.mkdir(parents=True, exist_ok=True)


def _apply_calibrator(method: str, calibrator, raw) -> np.ndarray:
    """Apply a fitted calibrator to raw GBM scores. Shared by train + inference."""
    raw = np.asarray(raw, dtype=float)
    if method == "isotonic":
        return np.asarray(calibrator.predict(raw), dtype=float)
    # sigmoid / Platt: LogisticRegression over the single raw-score feature
    return calibrator.predict_proba(raw.reshape(-1, 1))[:, 1]


def _model_path(event_type: str) -> Path:
    return _MODEL_DIR / f"risk_classifier_{event_type}.joblib"


def _feat_path(event_type: str) -> Path:
    return _MODEL_DIR / f"risk_feature_names_{event_type}.json"


# ── Training ─────────────────────────────────────────────────────────────────

def train(
    event_type: str = "flood",
    force_rebuild_dataset: bool = False,
    force_promote: bool = False,
) -> dict:
    """Train the RiskClassifier and persist the model.

    The model is PROMOTED (written to the live path) only if it beats the
    heuristic baseline, unless `force_promote=True`. Returns a metrics dict with
    PR-AUC, Brier, Recall@P90, a threshold matrix, validation-driven severity
    bands, the chosen calibration method, and the promotion decision.
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

    # SMOTE over-sampling for drought: minority class is often severely under-represented.
    if event_type == "drought":
        original_len = len(y_tr)
        try:
            from imblearn.over_sampling import SMOTE
            sm = SMOTE(random_state=42, k_neighbors=min(5, int(y_tr.sum()) - 1))
            X_tr, y_tr = sm.fit_resample(X_tr, y_tr)
            logger.info("SMOTE applied — drought train set: %d rows (was %d)", len(y_tr), original_len)
        except ImportError:
            logger.warning("imbalanced-learn not installed — skipping SMOTE. pip install imbalanced-learn")
        except Exception as e:
            logger.warning("SMOTE failed (%s) — training without resampling", e)

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

    # --- Calibration: fit isotonic AND sigmoid (Platt) on the temporal val set
    #     (2017-2019), then choose. Isotonic overfits tiny val sets, so
    #     pick_calibration_method forces sigmoid below MIN positives. ---
    from sklearn.linear_model import LogisticRegression

    raw_val = gbm.predict_proba(X_val)[:, 1]
    raw_te = gbm.predict_proba(X_te)[:, 1]
    val_positives = int(np.sum(y_val))

    iso = IsotonicRegression(out_of_bounds="clip")
    iso.fit(raw_val, y_val)
    sig = LogisticRegression(max_iter=1000)
    sig.fit(raw_val.reshape(-1, 1), y_val)

    brier_iso = brier_score_loss(y_val, _apply_calibrator("isotonic", iso, raw_val))
    brier_sig = brier_score_loss(y_val, _apply_calibrator("sigmoid", sig, raw_val))
    calibration_method = pick_calibration_method(val_positives, brier_iso, brier_sig)
    calibrator = iso if calibration_method == "isotonic" else sig
    logger.info(
        "Calibration: method=%s (val pos=%d, brier iso=%.4f sig=%.4f)",
        calibration_method, val_positives, brier_iso, brier_sig,
    )

    # --- Evaluate on held-out test set ---
    proba_te = _apply_calibrator(calibration_method, calibrator, raw_te)
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

    # --- Operational threshold matrix + validation-driven severity bands ---
    raw_val_cal = _apply_calibrator(calibration_method, calibrator, raw_val)
    severity_thresholds = derive_severity_thresholds(y_val, raw_val_cal)
    thr_matrix = threshold_matrix(y_te, proba_te, (0.3, 0.5, 0.7))
    sev_breakdown = severity_breakdown(y_te, proba_te, severity_thresholds)
    logger.info("Severity bands (val-derived): %s", severity_thresholds)

    # --- Promotion gate: never ship a model that fails to beat the heuristic ---
    beats = (pr_auc_te > baseline_pr_auc) if baseline_pr_auc is not None else None
    promote, promotion_reason = decide_promotion(beats, pr_auc_te, baseline_pr_auc)
    if force_promote and not promote:
        promote = True
        promotion_reason = "forced (force_promote=True): " + promotion_reason
    logger.info("Promotion: %s — %s", "PROMOTE" if promote else "BLOCKED", promotion_reason)

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
        "beats_baseline": bool(beats) if beats is not None else None,
        "promoted": bool(promote),
        "promotion_reason": promotion_reason,
        "calibration_method": calibration_method,
        "calibration_brier_isotonic": round(float(brier_iso), 4),
        "calibration_brier_sigmoid": round(float(brier_sig), 4),
        "severity_thresholds": severity_thresholds,
        "threshold_matrix": thr_matrix,
        "severity_breakdown": sev_breakdown,
        "n_train": int(len(y_tr)),
        "n_val": int(len(y_val)),
        "n_val_positives": val_positives,
        "n_test": int(len(y_te)),
        "n_features": int(X_tr.shape[1]),
        "gbm_iterations": int(gbm.n_iter_),
        "top_features": top_features,
    }

    # Persist ONLY if promoted — a blocked model leaves any existing live model
    # (or the heuristic fallback) untouched.
    if promote:
        joblib.dump(
            {
                "gbm": gbm,
                "calibrator": calibrator,
                "calibration_method": calibration_method,
                "severity_thresholds": severity_thresholds,
            },
            _model_path(event_type),
        )
        _feat_path(event_type).write_text(json.dumps(feat_names))
        logger.info("Model PROMOTED and saved: %s", _model_path(event_type))
    else:
        logger.warning(
            "Model NOT promoted (%s). Live model left untouched.", promotion_reason
        )

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
        # Backward compatible: older bundles persisted only an isotonic calibrator
        # and no severity bands.
        self._calibration_method = bundle.get("calibration_method", "isotonic")
        self._severity_thresholds = bundle.get("severity_thresholds", dict(DEFAULT_SEVERITY))
        feat_path = _feat_path(event_type)
        self._feat_names: list[str] = json.loads(feat_path.read_text()) if feat_path.exists() else []
        self._event_type = event_type

    @property
    def feature_names(self) -> list[str]:
        return self._feat_names

    @property
    def calibration_method(self) -> str:
        return self._calibration_method

    @property
    def severity_thresholds(self) -> dict:
        return self._severity_thresholds

    def severity_for(self, prob: float) -> str:
        return severity_label(prob, self._severity_thresholds)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Return calibrated probability of event for each sample. Shape: (n,)"""
        raw = self._gbm.predict_proba(X)[:, 1]
        return _apply_calibrator(self._calibration_method, self._calibrator, raw)

    def predict_from_coords(
        self,
        lat: float,
        lon: float,
        year: int,
        month: int,
        static: dict | None = None,
        precip_scale: float = 1.0,
        temp_delta_c: float = 0.0,
    ) -> dict:
        """Build features from coordinates and return risk score + metadata.

        Climate what-if knobs (the model's real inputs):
          `precip_scale`  — scales every precipitation feature (1.0 = no change);
                            derived totals/anomaly are recomputed consistently.
          `temp_delta_c`  — adds a constant to the ERA5 mean temperature feature.
        Neither touches training.
        """
        from app.ml.riesgo_climatico_dataset import _build_feature_row
        row = _build_feature_row(lat, lon, year, month, self._event_type, label=0, static=static)
        if row is None:
            return {"probability": None, "error": "insufficient_chirps_coverage"}

        if precip_scale != 1.0:
            _scale_precip_features(row, precip_scale)
        if temp_delta_c and row.get("era5_t2m") is not None:
            row["era5_t2m"] = row["era5_t2m"] + temp_delta_c

        feat_values = np.array(
            [row.get(f, 0.0) for f in self._feat_names], dtype=np.float32
        ).reshape(1, -1)

        prob = float(self.predict_proba(feat_values)[0])
        return {
            "probability": round(prob, 4),
            "severity": self.severity_for(prob),
            "event_type": self._event_type,
            "calibration_method": self._calibration_method,
            "features_used": len(self._feat_names),
        }


def _scale_precip_features(row: dict, scale: float) -> None:
    """In-place rainfall what-if: scale precip magnitudes, recompute derivations.

    Keeps the climatological baseline fixed so the anomaly still measures the
    departure of the (scaled) most-recent month from normal.
    """
    months = [row.get(f"precip_m{i}") for i in range(1, 7)]
    if any(m is None for m in months):
        return
    clim_last = months[-1] - row.get("precip_anomaly_last", 0.0)  # recover baseline
    months = [max(0.0, m * scale) for m in months]
    for i, v in enumerate(months, start=1):
        row[f"precip_m{i}"] = v
    row["precip_total_3m"] = float(sum(months[-3:]))
    row["precip_total_6m"] = float(sum(months))
    row["precip_max_month"] = float(max(months))
    row["precip_min_month"] = float(min(months))
    row["precip_anomaly_last"] = months[-1] - clim_last

    wet = dry = 0
    for v in reversed(months):
        if v > 100:
            wet += 1; dry = 0
        elif v < 30:
            dry += 1; wet = 0
        else:
            break
    row["consecutive_wet_months"] = float(wet)
    row["consecutive_dry_months"] = float(dry)


def is_trained(event_type: str = "flood") -> bool:
    return _model_path(event_type).exists()
