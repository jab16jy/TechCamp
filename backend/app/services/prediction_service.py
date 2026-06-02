import logging
import math
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

import httpx

from app.core.config import get_settings
from app.services.climate_service import fetch_nasa_climatology, _monthly_climatology_from_nasa

settings = get_settings()
logger = logging.getLogger(__name__)

MES_NOMBRES = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
}

MES_NOMBRE_A_NUM = {v.lower(): k for k, v in MES_NOMBRES.items()}
DECAY_ALPHA = 0.3


async def fetch_current_climate(lat: float, lng: float) -> dict:
    url = f"{settings.OPENMETEO_BASE_URL}/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation",
        "timezone": "America/Bogota",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            current = data.get("current", {})
            return {
                "temperatura": current.get("temperature_2m", 28.0),
                "humedad": current.get("relative_humidity_2m", 75.0),
                "precipitacion": current.get("precipitation", 80.0),
                "radiacion_solar": current.get("shortwave_radiation", 18.0),
            }
        except Exception:
            return {"temperatura": 28.0, "humedad": 75.0, "precipitacion": 80.0, "radiacion_solar": 18.0}


def _ndvi_estimate(month: int, base_ndvi: float = 0.42, precipitacion: float = 80) -> float:
    """Estima NDVI mensual usando base real o sintetico con variacion estacional.

    Si base_ndvi viene de Sentinel-2 (BD), genera una variacion estacional
    suave alrededor de ese valor. Si es sintetico, usa el modelo original.
    """
    import numpy as np
    # Factor de precipitacion: mas lluvia -> mas NDVI
    precip_factor = min(1.2, max(0.7, precipitacion / 100.0))
    # Factor estacional: meses humedos (abril-noviembre) tienen mas vegetacion
    if 4 <= month <= 11:
        precip_factor += 0.1
    # Variacion aleatoria determinista (reproducible por mes)
    rng = np.random.default_rng(42 + month)
    seasonal_noise = 0.95 + rng.random() * 0.1
    ndvi = base_ndvi * precip_factor * seasonal_noise
    return round(min(0.95, max(0.15, ndvi)), 2)


def _mes_siembra_to_num(mes_siembra: str | None) -> int:
    if not mes_siembra:
        return (datetime.now(timezone.utc).month % 12) + 1
    lowered = mes_siembra.strip().lower()
    return MES_NOMBRE_A_NUM.get(lowered, (datetime.now(timezone.utc).month % 12) + 1)


def _compute_npk_riego_factors(npk: float | None, riego: float | None) -> tuple[float, float]:
    npk_factor = 1.0
    if npk is not None:
        npk_norm = npk / 120.0
        npk_factor = 0.7 + 0.3 * min(2.0, max(0.5, npk_norm))

    riego_factor = 1.0
    if riego is not None:
        riego_norm = riego / 75.0
        riego_factor = 0.75 + 0.25 * min(1.5, max(0.5, riego_norm))

    return npk_factor, riego_factor


def _detect_disease_risks(months_projected: list[dict]) -> list[dict]:
    alerts = []
    consecutive_high_hum = 0
    fungal_triggered = False

    for i, m in enumerate(months_projected):
        hum = m.get("humedad", 0)
        prec = m.get("precipitacion", 0)

        is_high_hum = hum > 85
        is_rainy = prec > 100

        if is_high_hum and is_rainy:
            consecutive_high_hum += 1
        else:
            consecutive_high_hum = 0

        if consecutive_high_hum >= 1 and not fungal_triggered:
            fungal_triggered = True
            # Prioritaria: Roya del Café por ser cultivo estrella del Caribe colombiano
            cultivos_cultivados = [c["cultivo"] for c in m.get("cultivos_recomendados", [])]
            if "Cafe" in cultivos_cultivados or any("cafe" in c.lower() for c in cultivos_cultivados):
                alerts.append({
                    "tipo": "fitosanitario",
                    "severidad": "critico",
                    "mensaje": "Riesgo alto de Roya del Cafe: humedad >85% y lluvias persistentes. Aplicar fungicida preventivo a base de cobre.",
                    "cultivo_afectado": "Cafe",
                    "mes": m.get("month_num"),
                    "enfermedad": "Roya del Cafe (Hemileia vastatrix)",
                })
            else:
                alerts.append({
                    "tipo": "fitosanitario",
                    "severidad": "alto",
                    "mensaje": "Riesgo de Pudricion del Cogollo: humedad >85% y lluvias constantes favorecen Phytophthora. Monitorear drenaje y aplicar fungicida si hay sintomas.",
                    "cultivo_afectado": None,
                    "mes": m.get("month_num"),
                    "enfermedad": "Pudricion del Cogollo (Phytophthora spp.)",
                })

        # Riesgo de estres hidrico
        if hum < 50:
            alerts.append({
                "tipo": "estres_hidrico",
                "severidad": "alto" if hum < 40 else "moderado",
                "mensaje": f"Humedad critica proyectada ({hum}%) en {m.get('month', '')}. Programar riego suplementario.",
                "cultivo_afectado": None,
                "mes": m.get("month_num"),
                "enfermedad": None,
            })

        # Riesgo de estres termico (temperatura >35°C = Escenario Nino)
        temp = m.get("temperatura", 0)
        if temp > 35:
            alerts.append({
                "tipo": "estres_termico",
                "severidad": "critico",
                "mensaje": f"Temperatura extrema proyectada ({temp}°C) en {m.get('month', '')}. Riesgo de aborto floral. Evaluar sombra temporal o riego por microaspersion.",
                "cultivo_afectado": None,
                "mes": m.get("month_num"),
                "enfermedad": None,
            })

    return alerts


async def _find_optimal_window(lat: float, lng: float, start_month: int, n_months: int,
                               climatology: dict, temp_anomaly: float, prec_anomaly: float,
                               hum_anomaly: float) -> dict | None:
    now = datetime.now(timezone.utc)
    window_size = 7
    best_score = float("inf")
    best_start = None
    best_end = None

    total_days = 0
    if n_months >= 1:
        if start_month < now.month:
            first_date = datetime(now.year + 1, start_month, 1)
        elif start_month == now.month:
            first_date = datetime(now.year, now.month, now.day)
        else:
            first_date = datetime(now.year, start_month, 1)
        last_date = first_date + relativedelta(months=n_months)
        total_days = (last_date - first_date).days

    step = 3
    for day_offset in range(0, max(1, total_days - window_size), step):
        window_start = first_date + relativedelta(days=day_offset)
        window_end = window_start + relativedelta(days=window_size)
        risk_score = 0.0
        risk_reasons = []

        for d in range(window_size):
            day = window_start + relativedelta(days=d)
            m = day.month

            # Proyectar condiciones para ese dia usando el mismo decay
            month_idx = (m - start_month) % 12
            if month_idx < 0:
                month_idx += 12
            if month_idx >= n_months:
                continue

            decay = math.exp(-DECAY_ALPHA * month_idx)
            proj_temp = climatology.get("T2M", {}).get(m, 28.5) + temp_anomaly * decay
            proj_hum = climatology.get("RH2M", {}).get(m, 75) + hum_anomaly * decay

            if proj_temp > 35:
                risk_score += 5.0
                risk_reasons.append("temp_extrema(>35°C)")
            elif proj_temp > 33:
                risk_score += 2.0

            if proj_hum < 50:
                risk_score += 3.0
                risk_reasons.append("humedad_baja(<50%)")
            elif proj_hum < 60:
                risk_score += 1.0

        if risk_score < best_score:
            best_score = risk_score
            best_start = window_start
            best_end = window_end

    if best_start is None:
        return None

    confianza = max(10, min(100, 100 - best_score * 5))
    return {
        "ventana_inicio": best_start.strftime("%d de %B"),
        "ventana_fin": best_end.strftime("%d de %B"),
        "confianza": round(confianza, 1),
        "justificacion": (
            f"Ventana de {window_size} dias con menor riesgo acumulado de eventos extremos "
            f"(score de riesgo: {best_score:.1f})"
        ),
        "riesgo_minimizado": list(set(["Temperatura >35°C", "Humedad <50%"])) if best_score > 0 else [],
    }


CICLOS_DIAS = {
    "Maíz": 90, "Yuca": 270, "Arroz": 120, "Frijol": 75,
    "Ñame": 210, "Plátano": 365, "Cacao": 180, "Algodón": 150,
    "Sorgo": 110, "Palma Aceitera": 365,
}


def _etapa_fenologica(dias_desde_siembra: int, ciclo_dias: int) -> str:
    if dias_desde_siembra < 0:
        return "pre-siembra"
    pct = min(1.0, dias_desde_siembra / max(ciclo_dias, 1))
    if pct < 0.10:
        return "germinacion"
    if pct < 0.30:
        return "desarrollo-vegetativo"
    if pct < 0.55:
        return "floracion"
    if pct < 0.80:
        return "llenado"
    return "maduracion"


def _detect_climate_patterns(months_projected: list[dict], temp_anomaly: float, prec_anomaly: float) -> list[dict]:
    patterns = []
    # Niño: temperatura >35°C Y precipitacion <10mm (umbral refinado, antes <50mm)
    hot_dry = sum(1 for m in months_projected if m["temperatura"] > 35 and m["precipitacion"] < 10)
    # Niña: humedad >85% Y exceso de lluvia (>150mm)
    cold_wet = sum(1 for m in months_projected if m["temperatura"] < 26 and m["precipitacion"] > 150)
    # Niña adicional: humedad >85% en meses consecutivos
    high_hum_months = sum(1 for m in months_projected if m.get("humedad", 0) > 85)
    max_temp_anom = max((m["temperatura"] - 28 for m in months_projected if "temperatura" in m), default=0)
    min_prec_anom = min((m["precipitacion"] for m in months_projected if "precipitacion" in m), default=100)

    if hot_dry >= 2 and temp_anomaly > 2.0:
        patterns.append({
            "tipo": "fenomeno_nino",
            "severidad": "critico",
            "mensaje": f"Patron El Niño detectado: {hot_dry} meses con temperatura extrema (>35°C) y deficit hidrico severo (<10mm). Anomalia termica: +{temp_anomaly:.1f}°C.",
            "cultivo_afectado": None,
            "mes": None,
            "accion": "Preparar sistemas de riego suplementario. Evaluar cultivos tolerantes a sequia (Yuca, Sorgo).",
        })
    # Niña con humedad >85% y suelo saturado (exceso de lluvia)
    if (cold_wet >= 2 or high_hum_months >= 2) and prec_anomaly > 30:
        patterns.append({
            "tipo": "fenomeno_nina",
            "severidad": "alto",
            "mensaje": f"Patron La Niña detectado: {cold_wet} meses con exceso de lluvia y {high_hum_months} meses con humedad >85%. Anomalia de precipitacion: +{prec_anomaly:.1f}%.",
            "cultivo_afectado": None,
            "mes": None,
            "accion": "Preparar sistemas de drenaje. Monitorear riesgos fungicos (Roya, Pudricion del Cogollo).",
        })
    if not patterns and temp_anomaly > 1.5:
        patterns.append({
            "tipo": "tendencia_calida",
            "severidad": "moderado",
            "mensaje": f"Tendencia mas calida de lo normal. Anomalia termica: +{temp_anomaly:.1f}°C sobre el historico.",
            "cultivo_afectado": None,
            "mes": None,
            "accion": "Ajustar fechas de siembra para evitar picos de calor en floracion.",
        })
    return patterns


async def project_window(
    lat: float,
    lng: float,
    start_month: int | None = None,
    n_months: int = 3,
    ph_suelo: float = 6.5,
    materia_organica: float = 3.0,
    textura_suelo: str = "Franco",
    tipo_suelo: str = "Franco-Arcilloso",
    npk_override: float | None = None,
    riego_override: float | None = None,
    fecha_inicio: str | None = None,
    dias_desde_siembra: int | None = None,
    ciclo_dias: int | None = None,
    base_ndvi: float | None = None,
    cultivo: str | None = None,
) -> dict:
    from app.ml.inference import predict_crop_recommendations

    nasa_data = await fetch_nasa_climatology(lat, lng)
    climatology = _monthly_climatology_from_nasa(nasa_data)
    current = await fetch_current_climate(lat, lng)

    now = datetime.now(timezone.utc)
    if fecha_inicio:
        try:
            now = datetime.fromisoformat(fecha_inicio.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            now = datetime.now(timezone.utc)
    current_month = now.month

    if start_month is None:
        start_month = (current_month % 12) + 1

    current_temp = current["temperatura"]
    current_hum = current["humedad"]
    current_prec = current["precipitacion"]

    hist_temp = climatology.get("T2M", {}).get(current_month, current_temp)
    hist_prec = climatology.get("PRECTOTCORR", {}).get(current_month, current_prec)
    hist_hum = climatology.get("RH2M", {}).get(current_month, current_hum)

    temp_anomaly = current_temp - hist_temp if hist_temp else 0
    prec_anomaly = current_prec - hist_prec if hist_prec else 0
    hum_anomaly = current_hum - hist_hum if hist_hum else 0

    npk_factor, riego_factor = _compute_npk_riego_factors(npk_override, riego_override)

    months = []
    best_score = 0
    best_month = None
    best_crop = None
    metodo_usado = "heuristico"

    for i in range(n_months):
        future = now + relativedelta(months=i + 1)
        effective_month = ((start_month - 1 + i) % 12) + 1
        y = future.year

        decay = math.exp(-DECAY_ALPHA * i)

        proj_temp = climatology.get("T2M", {}).get(effective_month, 28.5) + temp_anomaly * decay
        proj_prec = climatology.get("PRECTOTCORR", {}).get(effective_month, 80) + prec_anomaly * decay
        proj_hum = climatology.get("RH2M", {}).get(effective_month, 75) + hum_anomaly * decay
        proj_rad = climatology.get("ALLSKY_SFC_SW_DWN", {}).get(effective_month, 5.0)

        # Aplicar factores de NPK y riego
        proj_hum = min(98, max(30, proj_hum * riego_factor))
        proj_prec = max(0, proj_prec * riego_factor)

        # Usar NDVI real de la BD si existe, si no estimar con modelo
        ndvi_base = base_ndvi if base_ndvi is not None else 0.42
        ndvi = _ndvi_estimate(effective_month, ndvi_base, proj_prec)

        # NPK afecta NDVI (mas fertilizacion → mas vigor)
        ndvi = min(0.95, ndvi * npk_factor)

        # NPK afecta la materia organica efectiva
        mo_effective = materia_organica * npk_factor

        scores, metodo = predict_crop_recommendations(
            temperatura=proj_temp,
            humedad=proj_hum,
            precipitacion=proj_prec,
            ph_suelo=ph_suelo,
            materia_organica=mo_effective,
            ndvi=ndvi,
            textura_suelo=textura_suelo,
            tipo_suelo=tipo_suelo,
        )
        metodo_usado = metodo

        month_entry = {
            "month": MES_NOMBRES.get(effective_month, "Desconocido"),
            "year": y,
            "month_num": effective_month,
            "temperatura": round(proj_temp, 1),
            "precipitacion": round(proj_prec, 1),
            "humedad": round(proj_hum, 1),
            "ndvi_estimado": ndvi,
            "radiacion_solar": round(proj_rad, 1) if proj_rad else None,
            "etapa_fenologica": _etapa_fenologica(
                (dias_desde_siembra or 0) + i * 30, ciclo_dias or 90
            ) if dias_desde_siembra is not None else None,
            "cultivos_recomendados": [
                {
                    "cultivo": s["cultivo"],
                    "score": s["score"],
                    "riesgo": s["riesgo"],
                    "emoji": s["emoji"],
                    "metodo": s.get("metodo", "heuristico"),
                    "probabilidad": s.get("probabilidad"),
                    "factor_weights": s.get("factor_weights", []),
                }
                for s in scores
            ],
        }
        months.append(month_entry)

        if scores and scores[0]["score"] > best_score:
            best_score = scores[0]["score"]
            best_month = MES_NOMBRES.get(effective_month)
            best_crop = scores[0]["cultivo"]

    alertas = _detect_disease_risks(months)
    alertas_patrones = _detect_climate_patterns(months, temp_anomaly, prec_anomaly)

    best_window = await _find_optimal_window(
        lat=lat, lng=lng, start_month=start_month, n_months=n_months,
        climatology=climatology, temp_anomaly=temp_anomaly,
        prec_anomaly=prec_anomaly, hum_anomaly=hum_anomaly,
    )

    fuente = (
        f"NASA POWER + OpenMeteo ({metodo_usado})"
        if nasa_data
        else f"Datos historicos del Caribe + OpenMeteo ({metodo_usado})"
    )

    return {
        "ubicacion": {"lat": lat, "lng": lng},
        "meses": months,
        "mejor_mes": best_month,
        "mejor_cultivo": best_crop,
        "fuente": fuente,
        "alertas_globales": alertas,
        "alertas_patrones": alertas_patrones,
        "best_window": best_window,
    }


async def project_window_with_scenario(
    lat: float = 10.97,
    lng: float = -74.78,
    n_months: int = 6,
    precip_delta_pct: float = 0,
    temp_delta_c: float = 0,
    npk_override: float | None = None,
    riego_override: float | None = None,
    ph_suelo: float = 6.5,
    materia_organica: float = 3.0,
    textura_suelo: str = "Franco",
    tipo_suelo: str = "Franco-Arcilloso",
    cultivo: str | None = None,
) -> dict:
    """Proyecta ventana de siembra con escenario climatico alterado.

    Extiende project_window() aplicando deltas de precipitacion y
    temperatura antes de la prediccion. Util para simulaciones
    what-if (Niño, Niña, escenarios personalizados).

    Args:
        lat: Latitud de la ubicacion.
        lng: Longitud de la ubicacion.
        n_months: Meses a proyectar (1-6).
        precip_delta_pct: Delta porcentual de precipitacion (-80 a +80).
        temp_delta_c: Delta de temperatura en °C (-5 a +5).
        npk_override: Ajuste de fertilizacion NPK en kg/ha.
        riego_override: Ajuste de riego en %.
        ph_suelo: pH del suelo.
        materia_organica: Materia organica en %.
        textura_suelo: Clasificacion USDA de textura.
        tipo_suelo: Tipo de suelo general.
        cultivo: Cultivo objetivo para la proyeccion.

    Returns:
        Diccionario con la proyeccion ajustada por escenario.
    """
    from app.ml.inference import predict_crop_recommendations

    nasa_data = await fetch_nasa_climatology(lat, lng)
    climatology = _monthly_climatology_from_nasa(nasa_data)
    current = await fetch_current_climate(lat, lng)

    now = datetime.now(timezone.utc)
    current_month = now.month
    start_month = (current_month % 12) + 1

    # Clima base actual
    current_temp = current["temperatura"] + temp_delta_c
    current_hum = current["humedad"]
    current_prec = current["precipitacion"] * (1 + precip_delta_pct / 100.0)

    hist_temp = climatology.get("T2M", {}).get(current_month, current_temp)
    hist_prec = climatology.get("PRECTOTCORR", {}).get(current_month, current_prec)
    hist_hum = climatology.get("RH2M", {}).get(current_month, current_hum)

    temp_anomaly = current_temp - hist_temp if hist_temp else temp_delta_c
    prec_anomaly = current_prec - hist_prec if hist_prec else precip_delta_pct
    hum_anomaly = current_hum - hist_hum if hist_hum else 0

    npk_factor, riego_factor = _compute_npk_riego_factors(npk_override, riego_override)

    months = []
    best_score = 0
    best_month = None
    best_crop = None
    metodo_usado = "heuristico"

    for i in range(n_months):
        future = now + relativedelta(months=i + 1)
        effective_month = ((start_month - 1 + i) % 12) + 1
        y = future.year

        decay = math.exp(-DECAY_ALPHA * i)

        # Aplicar deltas de escenario
        proj_temp = (
            climatology.get("T2M", {}).get(effective_month, 28.5)
            + (temp_anomaly * decay)
            + temp_delta_c * decay
        )
        proj_prec = (
            climatology.get("PRECTOTCORR", {}).get(effective_month, 80)
            + prec_anomaly * decay
        ) * (1 + precip_delta_pct / 100.0 * decay)
        proj_hum = climatology.get("RH2M", {}).get(effective_month, 75) + hum_anomaly * decay
        proj_rad = climatology.get("ALLSKY_SFC_SW_DWN", {}).get(effective_month, 5.0)

        proj_hum = min(98, max(30, proj_hum * riego_factor))
        proj_prec = max(0, proj_prec * riego_factor)

        ndvi = _ndvi_estimate(effective_month, 0.42, proj_prec)
        ndvi = min(0.95, ndvi * npk_factor)
        mo_effective = materia_organica * npk_factor

        scores, metodo = predict_crop_recommendations(
            temperatura=proj_temp,
            humedad=proj_hum,
            precipitacion=proj_prec,
            ph_suelo=ph_suelo,
            materia_organica=mo_effective,
            ndvi=ndvi,
            textura_suelo=textura_suelo,
            tipo_suelo=tipo_suelo,
        )
        metodo_usado = metodo

        month_entry = {
            "month": MES_NOMBRES.get(effective_month, "Desconocido"),
            "year": y,
            "month_num": effective_month,
            "temperatura": round(proj_temp, 1),
            "precipitacion": round(proj_prec, 1),
            "humedad": round(proj_hum, 1),
            "ndvi_estimado": ndvi,
            "radiacion_solar": round(proj_rad, 1) if proj_rad else None,
            "etapa_fenologica": None,
            "cultivos_recomendados": [
                {
                    "cultivo": s["cultivo"],
                    "score": s["score"],
                    "riesgo": s["riesgo"],
                    "emoji": s["emoji"],
                    "metodo": s.get("metodo", "heuristico"),
                    "probabilidad": s.get("probabilidad"),
                    "factor_weights": s.get("factor_weights", []),
                }
                for s in scores
            ],
        }
        months.append(month_entry)

        if scores and scores[0]["score"] > best_score:
            best_score = scores[0]["score"]
            best_month = MES_NOMBRES.get(effective_month)
            best_crop = scores[0]["cultivo"]

    alertas = _detect_disease_risks(months)
    alertas_patrones = _detect_climate_patterns(months, temp_anomaly, prec_anomaly)

    best_window = await _find_optimal_window(
        lat=lat, lng=lng, start_month=start_month, n_months=n_months,
        climatology=climatology, temp_anomaly=temp_anomaly,
        prec_anomaly=prec_anomaly, hum_anomaly=hum_anomaly,
    )

    fuente = (
        f"NASA POWER + OpenMeteo ({metodo_usado}) [Escenario: "
        f"precip {precip_delta_pct:+.0f}%, temp {temp_delta_c:+.1f}°C]"
        if nasa_data
        else f"Datos historicos Caribe ({metodo_usado}) [Escenario]"
    )

    return {
        "ubicacion": {"lat": lat, "lng": lng},
        "meses": months,
        "mejor_mes": best_month,
        "mejor_cultivo": best_crop,
        "fuente": fuente,
        "alertas_globales": alertas,
        "alertas_patrones": alertas_patrones,
        "best_window": best_window,
        "scenario_applied": {
            "precip_delta_pct": precip_delta_pct,
            "temp_delta_c": temp_delta_c,
            "npk_override": npk_override,
            "riego_override": riego_override,
        },
    }
