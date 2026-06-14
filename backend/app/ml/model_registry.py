"""Filesystem-based model version registry.

Directory structure:
  backend/app/ml/models/
    flood_v20260614_120000/
      risk_classifier_flood.joblib
      metadata.json
    drought_v20260614_120001/
      risk_classifier_drought.joblib
      metadata.json
    lstm_v20260614_120002/
      lstm_forecaster.keras
      lstm_forecaster_scaler.joblib
      lstm_forecaster_clim.json
      metadata.json
    active.json  <- {"flood": "flood_v...", "drought": "drought_v...", "lstm": "lstm_v..."}
"""
import json
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

_ACTIVE_PATH = MODELS_DIR / "active.json"


# ── Internal helpers ──────────────────────────────────────────────────────────

def _load_active() -> dict[str, str]:
    """Load active.json — returns {} if missing or corrupt."""
    if not _ACTIVE_PATH.exists():
        return {}
    try:
        return json.loads(_ACTIVE_PATH.read_text())
    except Exception:
        return {}


def _save_active(active: dict[str, str]) -> None:
    _ACTIVE_PATH.write_text(json.dumps(active, indent=2))


def _version_tag(event_type: str) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return f"{event_type}_v{ts}"


def _read_metadata(version_dir: Path) -> dict:
    meta_path = version_dir / "metadata.json"
    if not meta_path.exists():
        return {}
    try:
        return json.loads(meta_path.read_text())
    except Exception:
        return {}


# ── Public API ────────────────────────────────────────────────────────────────

def save_version(event_type: str, source_files: list[Path], metrics: dict) -> Path:
    """Copy model files to a new timestamped version directory and write metadata.json.

    Args:
        event_type:   "flood" | "drought" | "lstm"
        source_files: list of Paths to copy into the new version directory
        metrics:      metrics dict to embed in metadata.json

    Returns:
        Path to the new version directory.
    """
    tag = _version_tag(event_type)
    version_dir = MODELS_DIR / tag
    version_dir.mkdir(parents=True, exist_ok=True)

    for src in source_files:
        if src.exists():
            shutil.copy2(src, version_dir / src.name)
            logger.debug("Copied %s → %s", src.name, version_dir)
        else:
            logger.warning("Source file not found (skipping): %s", src)

    metadata = {
        "version": tag,
        "event_type": event_type,
        "trained_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"),
        "metrics": metrics,
        "n_train": metrics.get("n_train"),
        "promoted": False,
    }
    (version_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))
    logger.info("Saved version %s to %s", tag, version_dir)
    return version_dir


def get_active_version(event_type: str) -> Path | None:
    """Return path to the active version directory, or None if not set."""
    active = _load_active()
    tag = active.get(event_type)
    if tag is None:
        return None
    version_dir = MODELS_DIR / tag
    return version_dir if version_dir.exists() else None


def promote_if_better(event_type: str, new_metrics: dict, new_version_dir: Path) -> bool:
    """Compare new_metrics["test_pr_auc"] vs the active version.

    Promotes the new version if its PR-AUC is strictly higher, or if there is
    no currently active version.

    Returns:
        True  — new version promoted to active
        False — active version retained (new version not better)
    """
    current_dir = get_active_version(event_type)

    if current_dir is None:
        # No active version yet — always promote.
        _promote(event_type, new_version_dir)
        return True

    current_meta = _read_metadata(current_dir)
    current_pr_auc = current_meta.get("metrics", {}).get("test_pr_auc", 0.0)
    new_pr_auc = new_metrics.get("test_pr_auc", 0.0)

    if new_pr_auc > current_pr_auc:
        _promote(event_type, new_version_dir)
        return True

    logger.info(
        "NOT PROMOTED — new PR-AUC %.4f <= current %.4f (%s)",
        new_pr_auc, current_pr_auc, current_dir.name,
    )
    return False


def _promote(event_type: str, version_dir: Path) -> None:
    """Mark version_dir as active for event_type and update its metadata."""
    active = _load_active()
    active[event_type] = version_dir.name
    _save_active(active)

    # Update promoted flag in metadata
    meta_path = version_dir / "metadata.json"
    if meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text())
            meta["promoted"] = True
            meta_path.write_text(json.dumps(meta, indent=2))
        except Exception as exc:
            logger.warning("Could not update promoted flag: %s", exc)

    logger.info("PROMOTED %s → active for %s", version_dir.name, event_type)


def list_versions(event_type: str) -> list[dict]:
    """List all versions for event_type with their metadata, sorted newest first."""
    active = _load_active()
    active_tag = active.get(event_type)

    versions: list[dict] = []
    for version_dir in sorted(MODELS_DIR.iterdir(), reverse=True):
        if not version_dir.is_dir():
            continue
        if not version_dir.name.startswith(f"{event_type}_v"):
            continue
        meta = _read_metadata(version_dir)
        meta["is_active"] = version_dir.name == active_tag
        versions.append(meta)

    return versions
