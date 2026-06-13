import os
from pathlib import Path

# Override via env var for production / CI
_DEFAULT_DATA_DIR = Path("/home/jabyn/Downloads/dataset ml prediccciones")
DATA_DIR = Path(os.environ.get("CLIMATE_DATA_DIR", _DEFAULT_DATA_DIR))

CHIRPS_DIR = DATA_DIR / "chirps_monthly_colombia"

HDX_PATH = DATA_DIR / "datos_precipitaciones_inundaciones_1990_2020_colombia.xlsx"

UNGRD_CSV_PATHS = [
    DATA_DIR / "Emergencias_UNGRD._20260612.csv",
    DATA_DIR / "ungrd_2020.csv",
    DATA_DIR / "ungrd_2023_2024.csv",
]

# DesInventar Colombia XML — populated once user downloads from db.desinventar.org
DESINVENTAR_PATH = DATA_DIR / "desinventar_col.xml"

ERA5_DIR = DATA_DIR / "era5"

# Colombia department centroids keyed by DANE code (first 2 digits of DIVIPOLA).
# (lon, lat) in WGS84.
DEPT_CENTROIDS: dict[int, tuple[float, float]] = {
    5:  (-75.5774,  6.5980),   # Antioquia
    8:  (-75.0918, 10.3910),   # Atlántico
    11: (-74.0721,  4.7110),   # Bogotá D.C.
    13: (-74.8990,  9.2360),   # Bolívar
    15: (-72.7989,  5.8454),   # Boyacá
    17: (-75.2104,  5.3158),   # Caldas
    18: (-75.8149,  1.5539),   # Caquetá
    19: (-77.2811,  2.4448),   # Cauca
    20: (-73.6536, 10.4631),   # Cesar
    23: (-75.8830,  8.7493),   # Córdoba
    25: (-74.3667,  4.6097),   # Cundinamarca
    27: (-76.6583,  5.6947),   # Chocó
    41: (-75.5278,  2.5359),   # Huila
    44: (-72.9068, 11.5405),   # La Guajira
    47: (-74.1836, 10.3910),   # Magdalena
    50: (-73.6388,  3.8559),   # Meta
    52: (-77.2811,  1.2136),   # Nariño
    54: (-72.5078,  7.9463),   # Norte de Santander
    63: (-75.6624,  4.4610),   # Quindío
    66: (-75.6944,  5.0689),   # Risaralda
    68: (-73.1198,  6.6437),   # Santander
    70: (-75.3984,  9.3048),   # Sucre
    73: (-75.2365,  4.0925),   # Tolima
    76: (-76.4985,  3.8509),   # Valle del Cauca
    81: (-71.5724,  5.8192),   # Arauca
    85: (-72.7989,  4.8133),   # Casanare
    86: (-75.5278,  0.4536),   # Putumayo
    88: (-81.7167, 12.5833),   # San Andrés
    91: (-72.3219, -0.8572),   # Amazonas
    94: (-72.5078,  2.5359),   # Guainía
    95: (-72.9068,  2.5685),   # Guaviare
    97: (-70.5859,  0.8554),   # Vaupés
    99: (-66.8750,  3.8282),   # Vichada
}


def divipola_to_coords(divipola: int) -> tuple[float, float] | None:
    """Return (lon, lat) centroid for the department containing this DIVIPOLA code."""
    dept_code = divipola // 1000
    return DEPT_CENTROIDS.get(dept_code)
