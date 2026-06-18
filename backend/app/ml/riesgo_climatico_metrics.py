"""Pure, testable metric & calibration helpers for the RiskClassifier.

Kept free of training/I/O so the operational logic the plan asks for —
threshold matrix, per-severity precision/recall, validation-derived severity
thresholds, and the calibration-method decision — can be unit-tested directly.
"""
from __future__ import annotations

import numpy as np

# Operational severity bands. medio/alto/critico are the lower edges; below
# `medio` is "bajo". These are sane defaults; `derive_severity_thresholds`
# replaces them with validation-driven values when the data supports it.
DEFAULT_SEVERITY = {"medio": 0.3, "alto": 0.5, "critico": 0.7}

# Precision targets used to place each severity edge from validation data.
SEVERITY_PRECISION_TARGETS = {"medio": 0.4, "alto": 0.6, "critico": 0.8}


def threshold_matrix(
    y_true, proba, thresholds: tuple[float, ...] = (0.3, 0.5, 0.7)
) -> list[dict]:
    """Confusion counts + precision/recall at each operational threshold."""
    y = np.asarray(y_true).astype(int)
    p = np.asarray(proba, dtype=float)
    rows = []
    for t in thresholds:
        pred = p >= t
        tp = int(np.sum(pred & (y == 1)))
        fp = int(np.sum(pred & (y == 0)))
        fn = int(np.sum(~pred & (y == 1)))
        tn = int(np.sum(~pred & (y == 0)))
        prec = tp / (tp + fp) if (tp + fp) else None
        rec = tp / (tp + fn) if (tp + fn) else None
        rows.append({
            "threshold": round(float(t), 3),
            "tp": tp, "fp": fp, "fn": fn, "tn": tn,
            "precision": round(prec, 4) if prec is not None else None,
            "recall": round(rec, 4) if rec is not None else None,
        })
    return rows


def severity_label(prob: float, thresholds: dict) -> str:
    """Map a probability to bajo/medio/alto/critico using band lower-edges."""
    if prob >= thresholds["critico"]:
        return "critico"
    if prob >= thresholds["alto"]:
        return "alto"
    if prob >= thresholds["medio"]:
        return "medio"
    return "bajo"


def severity_breakdown(y_true, proba, thresholds: dict) -> dict:
    """Per-band sample count and observed positive rate (band precision)."""
    y = np.asarray(y_true).astype(int)
    p = np.asarray(proba, dtype=float)
    bands = {
        "bajo": (0.0, thresholds["medio"]),
        "medio": (thresholds["medio"], thresholds["alto"]),
        "alto": (thresholds["alto"], thresholds["critico"]),
        "critico": (thresholds["critico"], 1.0 + 1e-9),
    }
    out = {}
    for name, (lo, hi) in bands.items():
        mask = (p >= lo) & (p < hi)
        n = int(mask.sum())
        pos_rate = float(y[mask].mean()) if n else None
        out[name] = {
            "n": n,
            "positive_rate": round(pos_rate, 4) if pos_rate is not None else None,
        }
    return out


def derive_severity_thresholds(
    y_val,
    proba_val,
    targets: dict | None = None,
    default: dict | None = None,
) -> dict:
    """Pick severity edges from validation precision, not arbitrary numbers.

    For each band, choose the smallest probability threshold whose validation
    precision meets the band's target. Falls back to defaults when a target is
    unreachable (e.g. too few positives). The result is forced monotonic:
    medio <= alto <= critico.
    """
    from sklearn.metrics import precision_recall_curve

    targets = targets or SEVERITY_PRECISION_TARGETS
    result = dict(default or DEFAULT_SEVERITY)

    y = np.asarray(y_val).astype(int)
    p = np.asarray(proba_val, dtype=float)
    if y.sum() == 0 or len(np.unique(y)) < 2:
        return result  # cannot estimate precision — keep defaults

    prec, _rec, thr = precision_recall_curve(y, p)
    # precision_recall_curve returns prec of length len(thr)+1; prec[:-1] aligns
    # with thr (each threshold's precision). Find smallest thr meeting target.
    prec_at_thr = prec[:-1]
    for name, target_p in targets.items():
        idxs = np.where(prec_at_thr >= target_p)[0]
        if len(idxs):
            result[name] = round(float(np.min(thr[idxs])), 3)

    result["alto"] = max(result["alto"], result["medio"])
    result["critico"] = max(result["critico"], result["alto"])
    return result


def pick_calibration_method(
    val_positives: int,
    brier_isotonic: float,
    brier_sigmoid: float,
    min_positives: int = 20,
) -> str:
    """Decide isotonic vs sigmoid (Platt) calibration.

    Isotonic is flexible but overfits on small validation sets, so below
    `min_positives` we force sigmoid/Platt. Otherwise pick the lower Brier.
    """
    if val_positives < min_positives:
        return "sigmoid"
    return "isotonic" if brier_isotonic <= brier_sigmoid else "sigmoid"


def decide_promotion(
    beats_baseline: bool | None,
    pr_auc: float,
    baseline_pr_auc: float | None,
) -> tuple[bool, str]:
    """Gate model promotion: do not ship a model that fails to beat the heuristic.

    Returns (promote, reason).
    """
    if baseline_pr_auc is None:
        return True, "no baseline available — promoting by default"
    if pr_auc > baseline_pr_auc:
        gain = (pr_auc - baseline_pr_auc) / baseline_pr_auc * 100
        return True, f"beats heuristic baseline by +{gain:.1f}% PR-AUC"
    return False, (
        f"does NOT beat heuristic baseline (PR-AUC {pr_auc:.4f} <= "
        f"{baseline_pr_auc:.4f}) — not promoted"
    )
