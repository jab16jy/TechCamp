"""Dataset audit / diagnostic for the climate-risk RiskClassifier.

Produces an auditable, per-event diagnostic of the cached training dataset so
that downstream decisions (negative sampling, thresholds, calibration) are made
against real numbers instead of guesses. This is intentionally READ-ONLY: it
never rebuilds or mutates the dataset.

What it reports (per event_type):
  - overview        : rows, positives/negatives, positive rate, feature count
  - class_balance   : positives per temporal split (train / val / test)
  - temporal        : positives & negatives per year, years with zero positives
  - chirps_coverage : coverage stats and fraction below operational thresholds
  - era5_coverage   : which ERA5 columns exist and how often they are all-zero
  - static_features : whether soil/elevation static features made it into the cache
  - geo_coverage    : unique (dept, month) cells for positives vs negatives
  - negatives       : leakage collisions + "too easy" geographic/temporal negatives
  - flags           : human-readable warnings worth acting on

Usage:
    from app.ml.riesgo_climatico_audit import audit_event
    report = audit_event("drought")

CLI:
    python -m app.ml.riesgo_climatico_audit --event-type all
"""
from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

from app.ml.riesgo_climatico_dataset import TRAIN_END, VAL_END

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).parent / "data"

# Minimum positives in a calibration/eval split before we trust calibration &
# high-precision recall. Below this, isotonic calibration overfits badly.
MIN_SPLIT_POSITIVES = 20

META_COLS = {"year", "month", "lat", "lon", "event_type", "label", "dept_code"}
STATIC_COLS = ["soil_ph", "soil_clay", "soil_awc", "elevation_m"]


def _cache_path(event_type: str) -> Path:
    return _DATA_DIR / f"riesgo_climatico_{event_type}.parquet"


def _split_name(year: int) -> str:
    if year <= TRAIN_END:
        return "train"
    if year <= VAL_END:
        return "val"
    return "test"


def _round(x, n=4):
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return None
    return round(float(x), n)


def audit_event(event_type: str, df: pd.DataFrame | None = None) -> dict:
    """Return a structured diagnostic for one event type ("flood" | "drought").

    If `df` is None, loads the cached parquet. Raises FileNotFoundError if the
    cache is missing (so callers can decide whether to rebuild).
    """
    if df is None:
        path = _cache_path(event_type)
        if not path.exists():
            raise FileNotFoundError(
                f"No cached dataset for '{event_type}': {path}. "
                f"Run build_dataset('{event_type}') first."
            )
        df = pd.read_parquet(path)

    flags: list[str] = []
    n = len(df)
    pos = int(df["label"].sum())
    neg = n - pos
    feat_cols = [c for c in df.columns if c not in META_COLS]

    # ── Class balance per temporal split ────────────────────────────────────
    splits: dict[str, dict] = {}
    df = df.assign(_split=df["year"].map(_split_name))
    for name in ("train", "val", "test"):
        s = df[df["_split"] == name]
        s_pos = int(s["label"].sum())
        splits[name] = {
            "n": int(len(s)),
            "positives": s_pos,
            "negatives": int(len(s) - s_pos),
            "positive_rate": _round(s["label"].mean()) if len(s) else None,
        }
        if len(s) == 0:
            flags.append(f"{name} split is EMPTY — temporal boundaries may not fit the data range")
        elif s_pos < MIN_SPLIT_POSITIVES and name in ("val", "test"):
            flags.append(
                f"{name} split has only {s_pos} positives (< {MIN_SPLIT_POSITIVES}) — "
                f"calibration / Recall@P90 will be unstable"
            )

    # ── Temporal distribution ───────────────────────────────────────────────
    per_year = (
        df.groupby("year")["label"].agg(positives="sum", total="count").astype(int)
    )
    years_zero_pos = [int(y) for y, r in per_year.iterrows() if r["positives"] == 0]
    if years_zero_pos:
        flags.append(
            f"{len(years_zero_pos)} year(s) have ZERO positives "
            f"(e.g. {years_zero_pos[:6]}) — negatives there add little signal"
        )

    # ── CHIRPS coverage ─────────────────────────────────────────────────────
    chirps = {}
    if "chirps_coverage" in df:
        cc = df["chirps_coverage"]
        chirps = {
            "mean": _round(cc.mean()),
            "min": _round(cc.min()),
            "frac_below_0.9": _round((cc < 0.9).mean()),
            "frac_below_0.5": _round((cc < 0.5).mean()),
        }
        if chirps["frac_below_0.9"] and chirps["frac_below_0.9"] > 0.05:
            flags.append(f"{chirps['frac_below_0.9']*100:.1f}% of rows have CHIRPS coverage < 0.9")

    # ── ERA5 coverage ───────────────────────────────────────────────────────
    era5_cols = [c for c in df.columns if c.startswith("era5_")]
    era5 = {"columns": era5_cols, "present": bool(era5_cols)}
    if era5_cols:
        block = df[era5_cols]
        all_zero = (block == 0).all(axis=1)
        era5["frac_rows_all_zero"] = _round(all_zero.mean())
        if era5["frac_rows_all_zero"] and era5["frac_rows_all_zero"] > 0.1:
            flags.append(
                f"{era5['frac_rows_all_zero']*100:.1f}% of rows have ALL ERA5 features = 0 "
                f"(missing ERA5 imputed as 0)"
            )
    else:
        flags.append("No ERA5 features present in dataset")

    # ── Static features ─────────────────────────────────────────────────────
    static_present = [c for c in STATIC_COLS if c in df.columns]
    static_missing = [c for c in STATIC_COLS if c not in df.columns]
    if static_missing:
        flags.append(
            f"Static features missing from cache: {static_missing} "
            f"(dataset built before static enrichment, or prefetch failed)"
        )

    # ── Geographic / monthly coverage ───────────────────────────────────────
    pos_df = df[df["label"] == 1]
    neg_df = df[df["label"] == 0]
    pos_depts = set(pos_df["dept_code"].unique().tolist()) if "dept_code" in df else set()
    neg_depts = set(neg_df["dept_code"].unique().tolist()) if "dept_code" in df else set()
    pos_months = set(pos_df["month"].unique().tolist())

    geo = {
        "depts_total": int(df["dept_code"].nunique()) if "dept_code" in df else None,
        "depts_with_positives": len(pos_depts),
        "depts_negatives_only": sorted(neg_depts - pos_depts),
        "pos_unique_dept_month": int(pos_df.groupby(["dept_code", "month"]).ngroups)
        if "dept_code" in df else None,
        "neg_unique_dept_month": int(neg_df.groupby(["dept_code", "month"]).ngroups)
        if "dept_code" in df else None,
    }

    # ── Negative quality: leakage + "too easy" negatives ────────────────────
    negatives = {}
    if "dept_code" in df:
        pos_keys = set(
            map(tuple, pos_df[["dept_code", "year", "month"]].to_numpy().tolist())
        )
        neg_keys = list(
            map(tuple, neg_df[["dept_code", "year", "month"]].to_numpy().tolist())
        )
        collisions = sum(1 for k in neg_keys if k in pos_keys)

        # "too easy" = negatives drawn from a dept that NEVER has a positive, or a
        # month that NEVER has a positive for this event. They teach a trivial
        # geographic/seasonal boundary rather than a real frontier.
        neg_dept_never_pos = neg_df[~neg_df["dept_code"].isin(pos_depts)]
        neg_month_never_pos = neg_df[~neg_df["month"].isin(pos_months)]

        negatives = {
            "total": len(neg_df),
            "leakage_collisions_with_positives": int(collisions),
            "from_dept_without_any_positive": int(len(neg_dept_never_pos)),
            "frac_from_dept_without_positive": _round(len(neg_dept_never_pos) / max(len(neg_df), 1)),
            "from_month_without_any_positive": int(len(neg_month_never_pos)),
            "frac_from_month_without_positive": _round(len(neg_month_never_pos) / max(len(neg_df), 1)),
        }
        if collisions > 0:
            flags.append(
                f"LEAKAGE: {collisions} negatives share (dept, year, month) with a positive"
            )
        if negatives["frac_from_dept_without_positive"] and negatives["frac_from_dept_without_positive"] > 0.25:
            flags.append(
                f"{negatives['frac_from_dept_without_positive']*100:.0f}% of negatives come from "
                f"departments with no recorded events — likely too easy / geographically irrelevant"
            )

    return {
        "event_type": event_type,
        "overview": {
            "rows": n,
            "positives": pos,
            "negatives": neg,
            "positive_rate": _round(df["label"].mean()),
            "n_features": len(feat_cols),
            "year_min": int(df["year"].min()),
            "year_max": int(df["year"].max()),
        },
        "class_balance": splits,
        "temporal": {
            "years_with_zero_positives": years_zero_pos,
            "n_years": int(per_year.shape[0]),
        },
        "chirps_coverage": chirps,
        "era5_coverage": era5,
        "static_features": {"present": static_present, "missing": static_missing},
        "geo_coverage": geo,
        "negatives": negatives,
        "flags": flags,
    }


def audit_all() -> dict:
    out = {}
    for ev in ("flood", "drought"):
        try:
            out[ev] = audit_event(ev)
        except FileNotFoundError as e:
            out[ev] = {"error": str(e)}
    return out


def _print_report(event_type: str, rep: dict) -> None:
    if "error" in rep:
        print(f"\n{'='*64}\n  {event_type.upper()}: {rep['error']}\n{'='*64}")
        return
    ov = rep["overview"]
    print(f"\n{'='*64}")
    print(f"  AUDIT — {event_type.upper()}")
    print(f"{'='*64}")
    print(f"  rows={ov['rows']}  pos={ov['positives']}  neg={ov['negatives']}  "
          f"pos_rate={ov['positive_rate']}  features={ov['n_features']}  "
          f"years={ov['year_min']}-{ov['year_max']}")
    print("  -- class balance per split --")
    for name, s in rep["class_balance"].items():
        print(f"     {name:<5} n={s['n']:<6} pos={s['positives']:<5} rate={s['positive_rate']}")
    neg = rep.get("negatives", {})
    if neg:
        print("  -- negatives quality --")
        print(f"     leakage_collisions={neg['leakage_collisions_with_positives']}  "
              f"from_dept_without_positive={neg['frac_from_dept_without_positive']}  "
              f"from_month_without_positive={neg['frac_from_month_without_positive']}")
    era5 = rep["era5_coverage"]
    print(f"  -- era5: present={era5['present']} "
          f"all_zero_rows={era5.get('frac_rows_all_zero')}")
    sf = rep["static_features"]
    print(f"  -- static: present={sf['present']} missing={sf['missing']}")
    if rep["flags"]:
        print("  -- FLAGS --")
        for f in rep["flags"]:
            print(f"     ⚠  {f}")
    else:
        print("  -- FLAGS -- none")


def main() -> None:
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Audit climate-risk training dataset")
    parser.add_argument(
        "--event-type", choices=["flood", "drought", "all"], default="all"
    )
    parser.add_argument("--json", action="store_true", help="Emit raw JSON")
    args = parser.parse_args()

    events = ["flood", "drought"] if args.event_type == "all" else [args.event_type]
    reports = {}
    for ev in events:
        try:
            reports[ev] = audit_event(ev)
        except FileNotFoundError as e:
            reports[ev] = {"error": str(e)}

    if args.json:
        print(json.dumps(reports, indent=2))
    else:
        for ev in events:
            _print_report(ev, reports[ev])


if __name__ == "__main__":
    main()
