"""Real crop profiles for the Caribbean region.

Provides structured access to observed soil, foliar, and production
data from EVA, AGROSAVIA Suelos, and AGROSAVIA Foliar datasets.

Usage:
    from app.ml.perfiles_reales import PerfilCultivoReal

    profiles = PerfilCultivoReal.load_all()
    maiz = PerfilCultivoReal.get("Maíz")
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, fields
from pathlib import Path
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

PROFILES_PATH = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "caribe"
    / "perfiles_cultivo_reales.csv"
)


@dataclass
class PerfilCultivoReal:
    """Perfil fisicoquímico, foliar y productivo de un cultivo en el Caribe.

    Cada instancia agrega estadísticos descriptivos desde los datasets
    EVA (producción), AGROSAVIA Suelos (fisicoquímicos) y AGROSAVIA
    Foliar (tejido vegetal), procesados por separado y consolidados
    a nivel de cultivo.
    """

    cultivo: str
    ph_promedio: float
    ph_p10: float
    ph_p50: float
    ph_p90: float
    mo_promedio: float
    mo_p10: float
    mo_p50: float
    mo_p90: float
    # New soil chemistry fields (percentiles p10, p50, p90)
    calcio_promedio: Optional[float] = None
    calcio_p10: Optional[float] = None
    calcio_p50: Optional[float] = None
    calcio_p90: Optional[float] = None
    cic_promedio: Optional[float] = None
    cic_p10: Optional[float] = None
    cic_p50: Optional[float] = None
    cic_p90: Optional[float] = None
    conductividad_promedio: Optional[float] = None
    conductividad_p10: Optional[float] = None
    conductividad_p50: Optional[float] = None
    conductividad_p90: Optional[float] = None
    magnesio_promedio: Optional[float] = None
    magnesio_p10: Optional[float] = None
    magnesio_p50: Optional[float] = None
    magnesio_p90: Optional[float] = None
    azufre_promedio: Optional[float] = None
    azufre_p10: Optional[float] = None
    azufre_p50: Optional[float] = None
    azufre_p90: Optional[float] = None
    boro_promedio: Optional[float] = None
    boro_p10: Optional[float] = None
    boro_p50: Optional[float] = None
    boro_p90: Optional[float] = None
    sodio_promedio: Optional[float] = None
    sodio_p10: Optional[float] = None
    sodio_p50: Optional[float] = None
    sodio_p90: Optional[float] = None
    p_bray_promedio: Optional[float] = None
    p_bray_p10: Optional[float] = None
    p_bray_p50: Optional[float] = None
    p_bray_p90: Optional[float] = None
    k_interc_promedio: Optional[float] = None
    k_interc_p10: Optional[float] = None
    k_interc_p50: Optional[float] = None
    k_interc_p90: Optional[float] = None

    drenaje_predominante: Optional[str] = None
    topografia_predominante: Optional[str] = None
    n_foliar_promedio: Optional[float] = None
    p_foliar_promedio: Optional[float] = None
    k_foliar_promedio: Optional[float] = None
    n_registros_eva: int = 0
    n_registros_suelos: int = 0
    n_registros_foliar: int = 0
    n_municipios: int = 0
    n_departamentos: int = 0
    rendimiento_promedio: Optional[float] = None

    # -- CSV column mapping (CSV column → dataclass field) --
    COLUMN_MAP = {
        "cultivo": "cultivo",
        "ph_promedio": "ph_promedio",
        "ph_p10": "ph_p10",
        "ph_p50": "ph_p50",
        "ph_p90": "ph_p90",
        "mo_promedio": "mo_promedio",
        "mo_p10": "mo_p10",
        "mo_p50": "mo_p50",
        "mo_p90": "mo_p90",
        "calcio_promedio": "calcio_promedio",
        "calcio_p10": "calcio_p10",
        "calcio_p50": "calcio_p50",
        "calcio_p90": "calcio_p90",
        "cic_promedio": "cic_promedio",
        "cic_p10": "cic_p10",
        "cic_p50": "cic_p50",
        "cic_p90": "cic_p90",
        "conductividad_promedio": "conductividad_promedio",
        "conductividad_p10": "conductividad_p10",
        "conductividad_p50": "conductividad_p50",
        "conductividad_p90": "conductividad_p90",
        "magnesio_promedio": "magnesio_promedio",
        "magnesio_p10": "magnesio_p10",
        "magnesio_p50": "magnesio_p50",
        "magnesio_p90": "magnesio_p90",
        "azufre_promedio": "azufre_promedio",
        "azufre_p10": "azufre_p10",
        "azufre_p50": "azufre_p50",
        "azufre_p90": "azufre_p90",
        "boro_promedio": "boro_promedio",
        "boro_p10": "boro_p10",
        "boro_p50": "boro_p50",
        "boro_p90": "boro_p90",
        "sodio_promedio": "sodio_promedio",
        "sodio_p10": "sodio_p10",
        "sodio_p50": "sodio_p50",
        "sodio_p90": "sodio_p90",
        "p_bray_promedio": "p_bray_promedio",
        "p_bray_p10": "p_bray_p10",
        "p_bray_p50": "p_bray_p50",
        "p_bray_p90": "p_bray_p90",
        "k_interc_promedio": "k_interc_promedio",
        "k_interc_p10": "k_interc_p10",
        "k_interc_p50": "k_interc_p50",
        "k_interc_p90": "k_interc_p90",
        "drenaje_predominante": "drenaje_predominante",
        "topografia_predominante": "topografia_predominante",
        "n_foliar_promedio": "n_foliar_promedio",
        "p_foliar_promedio": "p_foliar_promedio",
        "k_foliar_promedio": "k_foliar_promedio",
        "n_registros_eva": "n_registros_eva",
        "n_registros_suelos": "n_registros_suelos",
        "n_registros_foliar": "n_registros_foliar",
        "n_municipios": "n_municipios",
        "n_departamentos": "n_departamentos",
        "rendimiento_promedio": "rendimiento_promedio",
    }

    @classmethod
    def load_all(cls, path: Optional[str] = None) -> dict[str, PerfilCultivoReal]:
        """Load all real profiles from CSV.

        Args:
            path: Path to the CSV file. Defaults to ``PROFILES_PATH``.

        Returns:
            Dictionary keyed by ``cultivo`` (e.g., ``"Maíz"``).

        Raises:
            FileNotFoundError: If the CSV does not exist.
            ValueError: If required columns are missing.
        """
        csv_path = Path(path) if path else PROFILES_PATH
        if not csv_path.exists():
            raise FileNotFoundError(
                f"Perfiles reales CSV not found at {csv_path}. "
                f"Run construir_perfiles.py first."
            )

        df = pd.read_csv(csv_path)
        required = {"cultivo", "ph_promedio", "mo_promedio"}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(
                f"CSV is missing required columns: {missing}. "
                f"Found columns: {list(df.columns)}"
            )

        profiles: dict[str, PerfilCultivoReal] = {}
        for _, row in df.iterrows():
            kwargs: dict = {}
            for csv_col, field_name in cls.COLUMN_MAP.items():
                val = row.get(csv_col)
                # Convert NaN to None for optional fields
                if pd.isna(val) if hasattr(pd, "isna") else val is None:
                    kwargs[field_name] = None
                else:
                    kwargs[field_name] = val

            # Ensure integer fields are int, not float when NaN-affected
            for int_field in ("n_registros_eva", "n_registros_suelos",
                              "n_registros_foliar", "n_municipios", "n_departamentos"):
                if kwargs.get(int_field) is None:
                    kwargs[int_field] = 0
                else:
                    kwargs[int_field] = int(kwargs[int_field])

            profile = cls(**kwargs)
            profiles[profile.cultivo] = profile

        logger.info(
            "Loaded %d real profiles from %s", len(profiles), csv_path
        )
        return profiles

    @classmethod
    def get(
        cls, cultivo: str, path: Optional[str] = None
    ) -> Optional[PerfilCultivoReal]:
        """Get profile for one crop.

        Args:
            cultivo: Crop name (e.g., ``"Maíz"``, ``"Yuca"``).
            path: Path to the CSV. Defaults to ``PROFILES_PATH``.

        Returns:
            The matching profile, or ``None`` if not found.
        """
        profiles = cls.load_all(path=path)
        return profiles.get(cultivo)

    def to_dict(self) -> dict:
        """Serialize to a plain dict (for JSON export)."""
        result = {}
        for f in fields(self):
            val = getattr(self, f.name)
            if val is not None:
                result[f.name] = val
        return result

    @staticmethod
    def compare_with_synthetic(
        real_profile: PerfilCultivoReal,
        synthetic_ph_min: float,
        synthetic_ph_max: float,
        synthetic_mo_min: float,
        synthetic_rendimiento: float,
    ) -> dict:
        """Compare a real profile against synthetic requirements.

        Performs a one-off comparison of pH, MO, and rendimiento,
        classifying each as COMPATIBLE / REVISAR / INCOMPATIBLE.

        Args:
            real_profile: The real profile to compare against.
            synthetic_ph_min: Lower pH bound from crops_requirements.csv.
            synthetic_ph_max: Upper pH bound from crops_requirements.csv.
            synthetic_mo_min: Minimum MO from crops_requirements.csv.
            synthetic_rendimiento: Average yield from crops_requirements.csv.

        Returns:
            Dict with ``ph``, ``mo``, and ``rendimiento`` keys, each
            containing ``status``, ``diferencia_absoluta``, and
            ``explicacion``.
        """
        result = {}

        # --- pH ---
        syn_mid = (synthetic_ph_min + synthetic_ph_max) / 2
        if synthetic_ph_min <= real_profile.ph_p50 <= synthetic_ph_max:
            ph_status = "COMPATIBLE"
        else:
            ph_status = "REVISAR"
        result["ph"] = {
            "status": ph_status,
            "sintetico_rango": [synthetic_ph_min, synthetic_ph_max],
            "sintetico_medio": syn_mid,
            "real_mediana": real_profile.ph_p50,
            "diferencia_absoluta": round(
                abs(real_profile.ph_p50 - syn_mid), 4
            ),
            "explicacion": (
                f"Rango sintético [{synthetic_ph_min}, {synthetic_ph_max}] "
                f"{'contiene' if ph_status == 'COMPATIBLE' else 'NO contiene'} "
                f"la mediana real ({real_profile.ph_p50})"
            ),
        }

        # --- MO ---
        mo_diff = synthetic_mo_min - (real_profile.mo_p50 or 0)
        if mo_diff <= 0:
            mo_status = "COMPATIBLE"
        elif mo_diff < 1.0:
            mo_status = "REVISAR"
        else:
            mo_status = "INCOMPATIBLE"
        result["mo"] = {
            "status": mo_status,
            "sintetico_min": synthetic_mo_min,
            "real_mediana": real_profile.mo_p50,
            "diferencia_absoluta": round(mo_diff, 4),
            "explicacion": (
                f"MO mínima sintética ({synthetic_mo_min}%) "
                f"{'≤' if mo_diff <= 0 else 'EXCEDE en ' + str(round(mo_diff, 2)) + 'pp'} "
                f"mediana real ({real_profile.mo_p50 or 'N/A'}%)"
            ),
        }

        # --- Rendimiento ---
        real_rto = real_profile.rendimiento_promedio or 0
        if real_rto > 0:
            rto_diff_pct = (
                (synthetic_rendimiento - real_rto) / real_rto * 100
            )
            if rto_diff_pct <= 20:
                rto_status = "COMPATIBLE"
            elif rto_diff_pct <= 80:
                rto_status = "REVISAR"
            else:
                rto_status = "INCOMPATIBLE"
            direction = "MAYOR" if rto_diff_pct > 0 else "MENOR"
        else:
            rto_status = "INCOMPATIBLE"
            rto_diff_pct = None
            direction = "MAYOR"

        result["rendimiento"] = {
            "status": rto_status,
            "sintetico": synthetic_rendimiento,
            "real": real_rto,
            "diferencia_absoluta": round(
                synthetic_rendimiento - real_rto, 4
            ),
            "diferencia_porcentual": (
                round(abs(rto_diff_pct), 1) if rto_diff_pct is not None else None
            ),
            "direccion": direction,
            "explicacion": (
                f"Rendimiento sintético ({synthetic_rendimiento} t/ha) es {direction} "
                f"al real ({real_rto} t/ha)"
                + (
                    f" — {round(rto_diff_pct, 1)}%"
                    if rto_diff_pct is not None
                    else ""
                )
            ),
        }

        return result


def cargar_perfiles_reales(ruta: Optional[str] = None) -> list[PerfilCultivoReal]:
    """Load all real profiles from CSV as a list.

    Convenience function wrapping ``PerfilCultivoReal.load_all()``.

    Args:
        ruta: Path to the CSV file. Defaults to ``PROFILES_PATH``.

    Returns:
        List of ``PerfilCultivoReal`` instances, one per crop.
    """
    profiles = PerfilCultivoReal.load_all(path=ruta)
    return list(profiles.values())
