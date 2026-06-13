"""CLI entrypoint for RiskClassifier training.

Usage:
    python -m app.ml.riesgo_climatico_training [--event-type flood|drought|all]
                                                [--force-rebuild]

Outputs:
    app/ml/data/risk_classifier_{event_type}.joblib
    app/ml/data/risk_feature_names_{event_type}.json
    app/ml/model_metrics.json  (updated)
"""
import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

METRICS_PATH = Path(__file__).parent / "model_metrics.json"


def _load_existing_metrics() -> dict:
    if METRICS_PATH.exists():
        try:
            return json.loads(METRICS_PATH.read_text())
        except Exception:
            pass
    return {}


def _save_metrics(metrics_by_type: dict) -> None:
    existing = _load_existing_metrics()
    existing["climate_risk"] = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "models": metrics_by_type,
    }
    METRICS_PATH.write_text(json.dumps(existing, indent=2))
    logger.info("Metrics saved: %s", METRICS_PATH)


def train_event_type(event_type: str, force_rebuild: bool) -> dict:
    from app.ml.riesgo_climatico_model import train
    logger.info("=" * 60)
    logger.info("Training RiskClassifier for event_type=%s", event_type)
    logger.info("=" * 60)
    metrics = train(event_type, force_rebuild_dataset=force_rebuild)
    logger.info("Results: %s", json.dumps(metrics, indent=2))
    return metrics


def main():
    parser = argparse.ArgumentParser(description="Train climate risk classifier")
    parser.add_argument(
        "--event-type",
        choices=["flood", "drought", "all"],
        default="flood",
        help="Which event type to train (default: flood)",
    )
    parser.add_argument(
        "--force-rebuild",
        action="store_true",
        help="Force rebuild of the dataset cache",
    )
    args = parser.parse_args()

    types = ["flood", "drought"] if args.event_type == "all" else [args.event_type]
    results = {}
    for et in types:
        try:
            results[et] = train_event_type(et, args.force_rebuild)
        except Exception as e:
            logger.error("Training failed for %s: %s", et, e)
            results[et] = {"error": str(e)}

    _save_metrics(results)

    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    for et, m in results.items():
        if "error" in m:
            print(f"  {et}: ERROR — {m['error']}")
        else:
            beats = "✅ beats heuristic" if m.get("beats_baseline") else "⚠️  does NOT beat heuristic"
            print(f"  {et}: PR-AUC={m['test_pr_auc']:.4f} | Brier={m['test_brier']:.4f} | {beats}")
    print("=" * 60)


if __name__ == "__main__":
    main()
