"""Tests for the climate-risk dataset audit (app/ml/riesgo_climatico_audit.py).

These use synthetic DataFrames passed directly to audit_event(), so they do not
depend on the cached parquet being present and run fast / deterministically.
"""
import numpy as np
import pandas as pd
import pytest

from app.ml.riesgo_climatico_audit import (
    MIN_SPLIT_POSITIVES,
    audit_event,
)
from app.ml.riesgo_climatico_dataset import TRAIN_END, VAL_END


def _make_df(rows: list[dict]) -> pd.DataFrame:
    """Build a dataset-shaped DataFrame, filling required columns with defaults."""
    defaults = {
        "precip_total_6m": 100.0,
        "chirps_coverage": 1.0,
        "era5_t2m": 27.0,
        "era5_sro_mm": 1.0,
        "month_sin": 0.0,
        "month_cos": 1.0,
        "heuristic_score": 0.5,
        "lat": 10.0,
        "lon": -74.0,
        "event_type": "flood",
    }
    full = []
    for r in rows:
        merged = {**defaults, **r}
        full.append(merged)
    return pd.DataFrame(full)


class TestTemporalSplitAssignment:
    def test_rows_land_in_correct_split_by_year(self):
        df = _make_df([
            {"year": TRAIN_END, "month": 1, "dept_code": 8, "label": 1},
            {"year": VAL_END, "month": 2, "dept_code": 8, "label": 1},
            {"year": VAL_END + 1, "month": 3, "dept_code": 8, "label": 1},
        ])
        rep = audit_event("flood", df=df)
        assert rep["class_balance"]["train"]["n"] == 1
        assert rep["class_balance"]["val"]["n"] == 1
        assert rep["class_balance"]["test"]["n"] == 1

    def test_train_boundary_is_inclusive(self):
        df = _make_df([{"year": TRAIN_END, "month": 1, "dept_code": 8, "label": 1}])
        rep = audit_event("flood", df=df)
        assert rep["class_balance"]["train"]["positives"] == 1
        assert rep["class_balance"]["val"]["n"] == 0


class TestNegativeLeakage:
    def test_detects_collision_between_negative_and_positive(self):
        # A negative shares (dept, year, month) with a positive → leakage.
        df = _make_df([
            {"year": 2010, "month": 6, "dept_code": 8, "label": 1},
            {"year": 2010, "month": 6, "dept_code": 8, "label": 0},  # collision
            {"year": 2011, "month": 7, "dept_code": 8, "label": 0},  # clean
        ])
        rep = audit_event("flood", df=df)
        assert rep["negatives"]["leakage_collisions_with_positives"] == 1
        assert any("LEAKAGE" in f for f in rep["flags"])

    def test_no_collision_when_keys_disjoint(self):
        df = _make_df([
            {"year": 2010, "month": 6, "dept_code": 8, "label": 1},
            {"year": 2011, "month": 7, "dept_code": 8, "label": 0},
        ])
        rep = audit_event("flood", df=df)
        assert rep["negatives"]["leakage_collisions_with_positives"] == 0
        assert not any("LEAKAGE" in f for f in rep["flags"])


class TestEasyNegatives:
    def test_flags_negatives_from_dept_without_positive(self):
        # All positives in dept 8; many negatives in dept 99 (never a positive).
        rows = [{"year": 2010, "month": 6, "dept_code": 8, "label": 1}]
        rows += [{"year": 2010, "month": 6, "dept_code": 99, "label": 0} for _ in range(5)]
        df = _make_df(rows)
        rep = audit_event("flood", df=df)
        assert rep["negatives"]["from_dept_without_any_positive"] == 5
        assert rep["negatives"]["frac_from_dept_without_positive"] > 0.25
        assert any("departments with no recorded events" in f for f in rep["flags"])
        assert 99 in rep["geo_coverage"]["depts_negatives_only"]


class TestSmallSplitWarning:
    def test_warns_when_val_positives_below_threshold(self):
        rows = [{"year": 2005, "month": 1, "dept_code": 8, "label": 1} for _ in range(50)]
        # val split (TRAIN_END < year <= VAL_END) with only a few positives
        rows += [{"year": VAL_END, "month": 1, "dept_code": 8, "label": 1} for _ in range(3)]
        rows += [{"year": VAL_END + 1, "month": 1, "dept_code": 8, "label": 1} for _ in range(30)]
        df = _make_df(rows)
        rep = audit_event("flood", df=df)
        assert rep["class_balance"]["val"]["positives"] == 3
        assert rep["class_balance"]["val"]["positives"] < MIN_SPLIT_POSITIVES
        assert any("only 3 positives" in f for f in rep["flags"])


class TestStaticAndEra5:
    def test_reports_missing_static_features(self):
        df = _make_df([{"year": 2010, "month": 6, "dept_code": 8, "label": 1}])
        rep = audit_event("flood", df=df)
        # synthetic df has no soil_/elevation columns
        assert "soil_ph" in rep["static_features"]["missing"]
        assert any("Static features missing" in f for f in rep["flags"])

    def test_detects_era5_all_zero_rows(self):
        df = _make_df([
            {"year": 2010, "month": 6, "dept_code": 8, "label": 1,
             "era5_t2m": 0.0, "era5_sro_mm": 0.0},
            {"year": 2011, "month": 6, "dept_code": 8, "label": 0,
             "era5_t2m": 0.0, "era5_sro_mm": 0.0},
        ])
        rep = audit_event("flood", df=df)
        assert rep["era5_coverage"]["frac_rows_all_zero"] == 1.0
        assert any("ERA5 features = 0" in f for f in rep["flags"])


class TestOverviewIntegrity:
    def test_overview_counts_sum_correctly(self):
        df = _make_df([
            {"year": 2010, "month": 6, "dept_code": 8, "label": 1},
            {"year": 2011, "month": 7, "dept_code": 8, "label": 0},
            {"year": 2012, "month": 8, "dept_code": 8, "label": 0},
        ])
        rep = audit_event("flood", df=df)
        ov = rep["overview"]
        assert ov["rows"] == 3
        assert ov["positives"] + ov["negatives"] == ov["rows"]
        assert ov["positives"] == 1


def test_missing_cache_raises_filenotfound():
    with pytest.raises(FileNotFoundError):
        audit_event("nonexistent_event_type_xyz")
