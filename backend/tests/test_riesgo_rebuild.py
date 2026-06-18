"""Integration test for the dataset REBUILD path with all data sources mocked.

Exercises build_dataset() end-to-end (positives + hard negatives + static
enrichment + temporal split + parquet cache) without touching CHIRPS / ERA5 /
soil / elevation. Ties Phase 1 (audit) and Phase 2 (hard negatives + statics)
together: the rebuilt dataset must contain static columns, have no leakage, and
draw hard negatives from the same departments as the positives.
"""
from unittest.mock import AsyncMock, patch

import pandas as pd

import app.ml.riesgo_climatico_dataset as ds
from app.ml.data_sources.config import DEPT_CENTROIDS
from app.ml.riesgo_climatico_audit import audit_event


POS_DEPTS = [5, 8, 13]  # real DEPT_CENTROIDS keys


def _fake_labels() -> pd.DataFrame:
    rows = []
    # spread positives across train (<=2016), val (2017-2019), test (>=2020)
    years = [2000, 2003, 2006, 2010, 2014, 2018, 2019, 2022, 2023]
    for i, year in enumerate(years):
        for dept in POS_DEPTS:
            lon, lat = DEPT_CENTROIDS[dept]
            rows.append({
                "dept_code": dept, "year": year, "month": (i % 12) + 1,
                "lat": lat, "lon": lon, "event_type": "flood",
            })
    return pd.DataFrame(rows)


def _fake_precip(*_args, **_kwargs) -> dict:
    return {
        "precip_total_6m": 100.0,
        "precip_total_3m": 50.0,
        "precip_anomaly_last": 0.1,
        "consecutive_wet_months": 1.0,
        "consecutive_dry_months": 0.0,
        "chirps_coverage": 1.0,
    }


def _static_all() -> dict:
    return {
        dept: {"soil_ph": 6.5, "soil_clay": 30.0, "soil_awc": 0.15, "elevation_m": 50.0}
        for dept in DEPT_CENTROIDS
    }


def _build_flood(tmp_path):
    cache = tmp_path / "riesgo_climatico_dataset.parquet"
    with patch.object(ds, "CACHE_PATH", cache), \
         patch.object(ds, "load_all_labels", return_value=_fake_labels()), \
         patch.object(ds, "compute_precip_features", side_effect=_fake_precip), \
         patch.object(ds, "available_year_range", return_value=(1990, 2024)), \
         patch.object(ds, "era5_available", return_value=False), \
         patch.object(ds, "_heuristic_score", return_value=0.5), \
         patch.object(ds, "_prefetch_dept_static", new=AsyncMock(return_value=_static_all())):
        splits = ds.build_dataset("flood", force_rebuild=True)
    built = pd.read_parquet(cache.with_name("riesgo_climatico_flood.parquet"))
    return splits, built


class TestRebuildIntegration:
    def test_static_features_present_in_features_and_cache(self, tmp_path):
        (X_tr, y_tr, X_val, y_val, X_te, y_te, feat_names), built = _build_flood(tmp_path)
        for col in ("soil_ph", "soil_clay", "soil_awc", "elevation_m"):
            assert col in feat_names, f"{col} missing from feature names"
            assert col in built.columns
        # statics were actually populated (not all-None) for positive depts
        assert built["soil_ph"].notna().any()

    def test_audit_of_rebuilt_dataset_is_clean(self, tmp_path):
        _, built = _build_flood(tmp_path)
        rep = audit_event("flood", df=built)
        assert rep["static_features"]["missing"] == []
        assert rep["negatives"]["leakage_collisions_with_positives"] == 0
        assert rep["overview"]["positives"] > 0
        assert rep["overview"]["negatives"] > 0

    def test_hard_negatives_land_in_positive_departments(self, tmp_path):
        _, built = _build_flood(tmp_path)
        neg = built[built["label"] == 0]
        neg_depts = set(neg["dept_code"].unique().tolist())
        # hard negatives (HARD_NEG_FRAC) share a dept with a positive
        assert neg_depts & set(POS_DEPTS), "expected hard negatives in positive depts"

    def test_temporal_splits_non_empty(self, tmp_path):
        (X_tr, y_tr, X_val, y_val, X_te, y_te, _), _ = _build_flood(tmp_path)
        assert len(y_tr) > 0 and len(y_val) > 0 and len(y_te) > 0
        # negatives roughly NEG_RATIO per positive overall
        total_pos = int(y_tr.sum() + y_val.sum() + y_te.sum())
        total = len(y_tr) + len(y_val) + len(y_te)
        assert total > total_pos  # negatives were added
