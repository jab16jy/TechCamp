"""Tests for the pure metric & calibration helpers (riesgo_climatico_metrics)."""
import numpy as np

from app.ml.riesgo_climatico_metrics import (
    DEFAULT_SEVERITY,
    decide_promotion,
    derive_severity_thresholds,
    pick_calibration_method,
    severity_breakdown,
    severity_label,
    threshold_matrix,
)


class TestThresholdMatrix:
    def test_counts_and_precision_recall(self):
        y = [1, 1, 0, 0]
        p = [0.9, 0.4, 0.6, 0.1]
        rows = {r["threshold"]: r for r in threshold_matrix(y, p, (0.5,))}
        r = rows[0.5]
        # preds >= 0.5: idx0 (pos), idx2 (neg) → tp=1, fp=1, fn=1, tn=1
        assert (r["tp"], r["fp"], r["fn"], r["tn"]) == (1, 1, 1, 1)
        assert r["precision"] == 0.5
        assert r["recall"] == 0.5

    def test_emits_one_row_per_threshold(self):
        rows = threshold_matrix([1, 0], [0.8, 0.2], (0.3, 0.5, 0.7))
        assert [r["threshold"] for r in rows] == [0.3, 0.5, 0.7]


class TestSeverityLabel:
    def test_band_edges(self):
        th = {"medio": 0.3, "alto": 0.5, "critico": 0.7}
        assert severity_label(0.05, th) == "bajo"
        assert severity_label(0.3, th) == "medio"
        assert severity_label(0.5, th) == "alto"
        assert severity_label(0.95, th) == "critico"


class TestSeverityBreakdown:
    def test_bins_partition_all_samples(self):
        y = [0, 0, 1, 1, 1]
        p = [0.1, 0.35, 0.55, 0.75, 0.9]
        bd = severity_breakdown(y, p, DEFAULT_SEVERITY)
        assert sum(b["n"] for b in bd.values()) == len(y)
        assert bd["critico"]["positive_rate"] == 1.0
        assert bd["bajo"]["n"] == 1


class TestDeriveSeverityThresholds:
    def test_falls_back_to_defaults_when_no_positives(self):
        th = derive_severity_thresholds([0, 0, 0], [0.1, 0.2, 0.3])
        assert th == DEFAULT_SEVERITY

    def test_thresholds_are_monotonic(self):
        rng = np.random.default_rng(0)
        # separable-ish: positives get higher scores
        y = [0] * 50 + [1] * 50
        p = list(rng.uniform(0, 0.6, 50)) + list(rng.uniform(0.4, 1.0, 50))
        th = derive_severity_thresholds(y, p)
        assert th["medio"] <= th["alto"] <= th["critico"]


class TestPickCalibration:
    def test_forces_sigmoid_on_small_val(self):
        # isotonic has lower brier but val too small → still sigmoid
        assert pick_calibration_method(val_positives=5, brier_isotonic=0.1,
                                       brier_sigmoid=0.2, min_positives=20) == "sigmoid"

    def test_picks_lower_brier_when_val_large(self):
        assert pick_calibration_method(50, brier_isotonic=0.08,
                                       brier_sigmoid=0.12) == "isotonic"
        assert pick_calibration_method(50, brier_isotonic=0.15,
                                       brier_sigmoid=0.10) == "sigmoid"


class TestPromotionGate:
    def test_blocks_when_not_beating_baseline(self):
        promote, reason = decide_promotion(False, pr_auc=0.55, baseline_pr_auc=0.56)
        assert promote is False
        assert "not promoted" in reason

    def test_promotes_when_beating_baseline(self):
        promote, reason = decide_promotion(True, pr_auc=0.70, baseline_pr_auc=0.56)
        assert promote is True
        assert "beats" in reason

    def test_promotes_when_no_baseline(self):
        promote, _ = decide_promotion(None, pr_auc=0.70, baseline_pr_auc=None)
        assert promote is True
