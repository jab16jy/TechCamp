"""Retrain CLI for AgroCaribe IA ML models.

Usage:
    python -m app.ml.retrain [--event-type flood|drought|all] [--lstm] [--force-rebuild]

Flow:
    1. Train RiskClassifier (or LSTM when --lstm)
    2. Save new version via model_registry.save_version()
    3. Call model_registry.promote_if_better() — update active only if metrics improve
    4. Print result: "PROMOTED ✓" or "NOT PROMOTED (new PR-AUC X.XX < current X.XX)"
"""
import argparse
import logging
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("retrain")

# Paths to source model files (same as used in each trainer module)
_DATA_DIR = Path(__file__).parent / "data"

_RISK_SOURCE_FILES: dict[str, list[Path]] = {
    "flood": [
        _DATA_DIR / "risk_classifier_flood.joblib",
        _DATA_DIR / "risk_feature_names_flood.json",
    ],
    "drought": [
        _DATA_DIR / "risk_classifier_drought.joblib",
        _DATA_DIR / "risk_feature_names_drought.json",
    ],
}

_LSTM_SOURCE_FILES: list[Path] = [
    _DATA_DIR / "lstm_forecaster.keras",
    _DATA_DIR / "lstm_forecaster_scaler.joblib",
    _DATA_DIR / "lstm_forecaster_clim.json",
]


def _retrain_risk(event_type: str, force_rebuild: bool) -> None:
    """Train a RiskClassifier, version it, and promote if better."""
    from app.ml.riesgo_climatico_model import train
    from app.ml.model_registry import save_version, promote_if_better, get_active_version

    logger.info("=== Training RiskClassifier [%s] ===", event_type)
    metrics = train(event_type=event_type, force_rebuild_dataset=force_rebuild)

    new_pr_auc = metrics.get("test_pr_auc", 0.0)
    logger.info("Metrics — PR-AUC: %.4f | Brier: %.4f | Recall@P90: %.4f",
                new_pr_auc,
                metrics.get("test_brier", float("nan")),
                metrics.get("test_recall_at_p90", float("nan")))

    source_files = _RISK_SOURCE_FILES.get(event_type, [])
    version_dir = save_version(event_type, source_files, metrics)

    promoted = promote_if_better(event_type, metrics, version_dir)

    if promoted:
        print(f"[{event_type.upper()}] PROMOTED ✓  (PR-AUC {new_pr_auc:.4f})")
    else:
        current_dir = get_active_version(event_type)
        current_pr_auc: float | None = None
        if current_dir is not None:
            import json
            meta_path = current_dir / "metadata.json"
            if meta_path.exists():
                meta = json.loads(meta_path.read_text())
                current_pr_auc = meta.get("metrics", {}).get("test_pr_auc")
        if current_pr_auc is not None:
            print(
                f"[{event_type.upper()}] NOT PROMOTED "
                f"(new PR-AUC {new_pr_auc:.4f} < current {current_pr_auc:.4f})"
            )
        else:
            print(f"[{event_type.upper()}] NOT PROMOTED (new PR-AUC {new_pr_auc:.4f})")


def _retrain_lstm(force_rebuild: bool) -> None:
    """Train the LSTM forecaster, version it, and promote if better."""
    from app.ml.lstm_forecaster import train
    from app.ml.model_registry import save_version, promote_if_better, get_active_version

    logger.info("=== Training LSTM Forecaster ===")
    metrics = train()

    # Use val RMSE for precip as the promotion proxy metric.
    # Lower RMSE is better, so we convert: test_pr_auc = -rmse_precip for comparison.
    val_rmse_precip = metrics.get("val_rmse", {}).get("precip_mm", float("inf"))
    # Store as negative so promote_if_better (which uses >) still works correctly.
    promotion_metrics = {"test_pr_auc": -val_rmse_precip}

    logger.info("LSTM metrics — val RMSE precip: %.4f", val_rmse_precip)

    version_dir = save_version("lstm", _LSTM_SOURCE_FILES, {**metrics, **promotion_metrics})

    promoted = promote_if_better("lstm", promotion_metrics, version_dir)

    if promoted:
        print(f"[LSTM] PROMOTED ✓  (val RMSE precip {val_rmse_precip:.4f})")
    else:
        current_dir = get_active_version("lstm")
        current_rmse: float | None = None
        if current_dir is not None:
            import json
            meta_path = current_dir / "metadata.json"
            if meta_path.exists():
                meta = json.loads(meta_path.read_text())
                neg_auc = meta.get("metrics", {}).get("test_pr_auc")
                if neg_auc is not None:
                    current_rmse = -neg_auc
        if current_rmse is not None:
            print(
                f"[LSTM] NOT PROMOTED "
                f"(new val RMSE {val_rmse_precip:.4f} >= current {current_rmse:.4f})"
            )
        else:
            print(f"[LSTM] NOT PROMOTED (new val RMSE {val_rmse_precip:.4f})")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Retrain AgroCaribe IA ML models with automatic versioning."
    )
    parser.add_argument(
        "--event-type",
        choices=["flood", "drought", "all"],
        default=None,
        help="Which risk event type to retrain. Omit when using --lstm only.",
    )
    parser.add_argument(
        "--lstm",
        action="store_true",
        help="Retrain the LSTM forecaster (can be combined with --event-type).",
    )
    parser.add_argument(
        "--force-rebuild",
        action="store_true",
        help="Force rebuild of the dataset cache before training.",
    )
    args = parser.parse_args()

    # Default: if neither flag is meaningful, train flood risk classifier.
    train_risk = args.event_type is not None or not args.lstm

    if args.lstm:
        _retrain_lstm(force_rebuild=args.force_rebuild)

    if train_risk:
        event_type = args.event_type or "flood"
        if event_type == "all":
            for et in ("flood", "drought"):
                _retrain_risk(et, force_rebuild=args.force_rebuild)
        else:
            _retrain_risk(event_type, force_rebuild=args.force_rebuild)


if __name__ == "__main__":
    main()
