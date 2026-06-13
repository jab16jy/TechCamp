"""ERA5-Land monthly download script for Colombia (1990–2024).

Usage:
    python -m app.ml.data_sources.download_era5
    python -m app.ml.data_sources.download_era5 --years 2020 2021 2022

Requires:
    pip install cdsapi
    ~/.cdsapirc with valid UID + API key from https://cds.climate.copernicus.eu/

Downloads one NetCDF per year → era5_land_colombia_{YYYY}.nc
into ERA5_DIR (default: ~/Downloads/dataset ml prediccciones/era5/).

ERA5-Land monthly means product:
    Dataset  : reanalysis-era5-land-monthly-means
    Variables: 2m_temperature, total_precipitation, surface_runoff,
               volumetric_soil_water_layer_1..4
    Product  : monthly_averaged_reanalysis
    Grid     : 0.1° × 0.1° (native ERA5-Land resolution)
    Region   : Colombia  [N=13, W=-82, S=-2, E=-66]
"""
import argparse
import logging
import sys
from pathlib import Path

from app.ml.data_sources.config import ERA5_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Colombia bounding box — derived from department centroids + 1° buffer
# CDS order: [North, West, South, East]
AREA = [13.0, -82.0, -2.0, -66.0]

MONTHS = [f"{m:02d}" for m in range(1, 13)]

ERA5_VARIABLES = [
    "2m_temperature",
    "total_precipitation",
    "surface_runoff",
    "volumetric_soil_water_layer_1",
    "volumetric_soil_water_layer_2",
    "volumetric_soil_water_layer_3",
    "volumetric_soil_water_layer_4",
]

DEFAULT_YEARS = list(range(1990, 2025))   # 1990 – 2024 inclusive


def download_year(client, year: int, out_dir: Path, overwrite: bool = False) -> Path:
    out_path = out_dir / f"era5_land_colombia_{year}.nc"

    if out_path.exists() and not overwrite:
        logger.info("Already exists, skipping: %s", out_path.name)
        return out_path

    logger.info("Requesting ERA5-Land %d …", year)

    client.retrieve(
        "reanalysis-era5-land-monthly-means",
        {
            "product_type": "monthly_averaged_reanalysis",
            "variable": ERA5_VARIABLES,
            "year": str(year),
            "month": MONTHS,
            "time": "00:00",          # monthly means have a single time step per month
            "area": AREA,
            "format": "netcdf",
            "grid": [0.1, 0.1],
        },
        str(out_path),
    )

    logger.info("Saved: %s (%.1f MB)", out_path.name, out_path.stat().st_size / 1e6)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Download ERA5-Land monthly data for Colombia")
    parser.add_argument(
        "--years",
        nargs="+",
        type=int,
        default=DEFAULT_YEARS,
        help="Years to download (default: 1990–2024)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Re-download files that already exist",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=ERA5_DIR,
        help=f"Output directory (default: {ERA5_DIR})",
    )
    args = parser.parse_args()

    try:
        import cdsapi
    except ImportError:
        logger.error("cdsapi not installed. Run:  pip install cdsapi")
        sys.exit(1)

    args.out_dir.mkdir(parents=True, exist_ok=True)

    client = cdsapi.Client()

    years = sorted(args.years)
    logger.info("Downloading ERA5-Land for %d years: %d – %d", len(years), years[0], years[-1])
    logger.info("Output dir: %s", args.out_dir)

    failed: list[int] = []
    for year in years:
        try:
            download_year(client, year, args.out_dir, overwrite=args.overwrite)
        except Exception as exc:
            logger.error("FAILED year=%d: %s", year, exc)
            failed.append(year)

    if failed:
        logger.error("Failed years: %s", failed)
        sys.exit(1)
    else:
        logger.info("All downloads complete.")


if __name__ == "__main__":
    main()
