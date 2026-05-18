# Interpretacion del NDVI en Agricultura

## Que es el NDVI

El NDVI (Indice de Vegetacion de Diferencia Normalizada, por sus siglas
en ingles) es un indice espectral que mide el vigor y la salud de la
vegetacion a partir de imagenes satelitales. Se calcula con las bandas
roja (B04) e infrarroja cercana (B08) de Sentinel-2:

```
NDVI = (B08 - B04) / (B08 + B04)
```

## Rango de valores

| Rango NDVI | Interpretacion | Significado para agricultura |
|-----------|----------------|------------------------------|
| -1.0 a 0.0 | Agua, nubes, sombra, suelo desnudo | No hay vegetacion. Suelo descubierto o cuerpo de agua |
| 0.0 a 0.2 | Suelo con poca vegetacion | Suelo recien sembrado, barbecho |
| 0.2 a 0.3 | Vegetacion escasa o estresada | Cultivo con estres (sequia, plaga, deficiencia) |
| 0.3 a 0.5 | Vegetacion moderada | Cultivo en etapa vegetativa, cobertura aceptable |
| 0.5 a 0.7 | Vegetacion densa y saludable | Cultivo en pleno desarrollo, buen vigor |
| 0.7 a 1.0 | Vegetacion muy densa | Cultivo en maximo vigor, posiblemente cerca de cosecha |

## Interpretacion por etapa del cultivo

### Maiz
- Siembra (0-15 dias): NDVI 0.1-0.2
- Desarrollo vegetativo (20-40 dias): NDVI 0.3-0.5
- Floracion (45-60 dias): NDVI 0.6-0.8
- Llenado de grano (60-90 dias): NDVI 0.7-0.85
- Madurez (90-120 dias): NDVI desciende a 0.3-0.5

### Yuca
- Establecimiento (0-3 meses): NDVI 0.2-0.4
- Desarrollo vegetativo (3-6 meses): NDVI 0.5-0.8
- Engrosamiento de raices (6-10 meses): NDVI 0.6-0.8
- Madurez (10-12 meses): NDVI desciende a 0.4-0.5 (hojas amarillean)

### Platano
- Establecimiento (0-3 meses): NDVI 0.2-0.4
- Crecimiento (3-8 meses): NDVI 0.5-0.7
- Floracion (8-10 meses): NDVI 0.7-0.85
- Llenado (10-12 meses): NDVI 0.8-0.9
- Cosecha (12-14 meses): NDVI alto hasta corte

## Seniales de alerta en NDVI

| Patron | Posible causa | Accion recomendada |
|--------|--------------|-------------------|
| NDVI baja rapidamente | Estres hidrico severo | Regar inmediatamente |
| NDVI del cultivo menor que zona de referencia | Deficit nutricional | Fertilizar segun analisis |
| NDVI irregular (parches) | Plagas, enfermedades o mal drenaje | Inspeccionar en campo |
| NDVI no sube en etapa de desarrollo | Semilla de mala calidad o siembra profunda | Evaluar re-siembra |
| NDVI baja en zona especifica | Suelo pobre, compactado o con mal drenaje | Muestrear suelo en esa zona |

## NDVI en el Caribe colombiano

Valores tipicos por tipo de cobertura en la region:
- Bosque seco tropical: 0.5-0.7 (estacional)
- Pastos: 0.2-0.5 (varia mucho con lluvias)
- Cultivos de secano en verano: 0.15-0.35 (estresados)
- Cultivos de secano en invierno: 0.5-0.8 (vigorosos)
- Cultivos bajo riego: 0.6-0.85 (mas estables)
- Suelo desnudo: 0.05-0.15

## Limitaciones del NDVI

- Solo mide "verdor", no identifica la causa del estres
- Se satura en vegetacion muy densa (>0.8 no distingue bien)
- Afectado por nubosidad (comun en epocas de lluvia)
- No diferencia entre cultivo y maleza
- Debe combinarse con otros indices (NDWI para agua, SAVI para suelos)
  y con verificacion de campo para un diagnostico completo
