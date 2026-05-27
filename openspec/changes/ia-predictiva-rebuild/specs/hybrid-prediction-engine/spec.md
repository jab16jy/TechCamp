# Hybrid Prediction Engine Specification

## Purpose

Motor de predicción híbrido RF+LSTM con ensemble ponderado 60/40, entrenado sobre datos sintéticos NASA POWER, expuesto en `/predict` con fallback heurístico cuando LSTM no está disponible.

## Requirements

### Requirement: Predicción por Ensemble Ponderado

El motor DEBE combinar la salida del modelo Random Forest existente con la del modelo LSTM mediante un ensemble de promedio ponderado 60% RF / 40% LSTM. La predicción final DEBE incluir las métricas: rendimiento estimado, estrés hídrico, estrés térmico, y confianza del ensemble.

#### Scenario: Ensemble opera normalmente con ambos modelos disponibles

- GIVEN que ambos modelos RF y LSTM están cargados y operativos
- WHEN se recibe una solicitud `POST /predict` con datos de cultivo y ubicación válidos
- THEN la respuesta DEBE incluir `prediccion` calculada como `(rf_output × 0.6) + (lstm_output × 0.4)`
- AND el campo `modelo` DEBE ser `"ensemble_rf_lstm"`
- AND el campo `confianza` DEBE ser mayor a 0

#### Scenario: LSTM no disponible — fallback solo RF

- GIVEN que el modelo LSTM no pudo cargarse o su archivo `.h5` no existe
- WHEN se recibe una solicitud `POST /predict`
- THEN la respuesta DEBE usar solo la predicción del modelo RF
- AND el campo `modelo` DEBE ser `"rf_fallback"`
- AND el campo `confianza` DEBE reflejar la del modelo RF
- AND la respuesta NO DEBE exceder 2 segundos

### Requirement: Entrenamiento LSTM con Datos Sintéticos NASA POWER

El modelo LSTM DEBE entrenarse sobre series temporales sintéticas generadas a partir de datos históricos de la API NASA POWER. Las variables de entrada DEBEN incluir: temperatura media, precipitación acumulada, y humedad relativa por mes.

#### Scenario: Generación y entrenamiento exitoso

- GIVEN que la API NASA POWER es accesible con credenciales válidas
- WHEN se ejecuta el script de entrenamiento del LSTM
- THEN DEBE generar series sintéticas de al menos 36 meses para la ubicación objetivo
- AND DEBE guardar el modelo entrenado como archivo `.h5`
- AND DEBE registrar las métricas de pérdida (loss + val_loss) en logs estructurados

#### Scenario: API NASA POWER no responde

- GIVEN que la API NASA POWER no está disponible
- WHEN se intenta entrenar el modelo LSTM
- THEN DEBE loguear el error sin interrumpir el servicio
- AND el sistema DEBE continuar operando solo con RF
