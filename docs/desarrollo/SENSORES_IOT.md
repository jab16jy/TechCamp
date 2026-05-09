# 🛰️ AgroCaribe IA: Módulo de Sensores IoT y Telemetría

## 1. Visión del Sistema de Sensores
El módulo de Sensores IoT no es solo un visor de datos; es el **sistema nervioso central** de la parcela. Su propósito es fusionar la precisión de los datos físicos en tierra con la visión macroscópica de los satélites para ofrecer una verdad única sobre el estado del cultivo.

---

## 2. Arquitectura de Conectividad (Health Check)
Dado que el entorno agrícola es hostil para las telecomunicaciones, el sistema implementa un monitoreo de salud constante:

### 2.1 Monitoreo de Nodo (Heartbeat)
- **Estado de Batería:** Indicador visual (⚡) con niveles críticos por debajo del 20%.
- **Calidad de Señal (RSSI):** Monitoreo de intensidad de señal LoRaWAN o 4G/NB-IoT.
- **Lógica de Estimación:** Si un nodo pierde conexión por más de 12 horas, la IA marca la zona como **"Dato Estimado"**, utilizando proyecciones basadas en estaciones vecinas y datos satelitales Sentinel-2 para "llenar el vacío".

---

## 3. Visualización Geoespacial y Mapa de Calor
En lugar de tablas estáticas, el usuario interactúa con un gemelo digital de su parcela.

### 3.1 Nodos Interactivos
- **Ubicación en Mapa:** Los sensores se renderizan como puntos georreferenciados sobre una capa de mapa base (Satelital/Híbrido).
- **Interacción Hover:** Al pasar el cursor, se despliega una tarjeta flotante con:
  - Humedad del suelo actual vs. promedio de 7 días (Gráfico Sparkline).
  - Temperatura de la zona radicular.
  - Tiempo desde la última actualización.

### 3.2 Generación de Mapa de Calor (Heatmap)
- **Interpolación Espacial:** Se utiliza el algoritmo **IDW (Inverse Distance Weighting)** para generar un gradiente de color entre sensores, permitiendo identificar "bolsas" de sequía o exceso de humedad que un solo sensor no detectaría.
- **Frecuencia:** Actualización en tiempo real (vía MQTT) o cada 3 horas para conservar energía en nodos de batería.

---

## 4. Alertas de Umbral Crítico y Acción Directa
El sistema pasa de ser informativo a ser **operativo**.

### 4.1 Modo Alerta de Parcela
- **Disparador:** Humedad < 15% o Temperatura Suelo > 35°C.
- **Efecto Visual:** La tarjeta del sensor y el borde de la sección en la UI cambian a un estilo de "Alerta Ámbar" con pulsación visual.
- **Vínculo de Acción:** Se genera un botón directo de **"Programar Riego"** o **"Consultar Agro-Asesor"** que ya viene precargado con el contexto de la alerta.

---

## 5. Telemetría Comparativa: Sensor vs. Satélite
Esta es la funcionalidad de validación cruzada que garantiza la máxima fiabilidad.

| Capa de Datos | Fuente | Resolución | Propósito |
| :--- | :--- | :--- | :--- |
| **Dato Físico** | Sensor IoT (Humedad) | Puntual (Real) | Verdad absoluta en el punto exacto de la raíz. |
| **Dato Satelital** | Sentinel-2 (NDWI) | 10m x 10m | Ver tendencia de hidratación en toda la biomasa. |

- **Análisis de Discrepancia:** Si el satélite muestra vigor alto (NDVI > 0.7) pero el sensor muestra sequía, la IA alerta sobre una posible **obstrucción del sensor** o una necesidad inminente de riego profundo antes de que la planta muestre estrés visual.

---

## 6. Especificaciones Técnicas del Stack IoT
- **Protocolo de Comunicación:** MQTT (Message Queuing Telemetry Transport) para bajo consumo.
- **Gateway:** Concentrador LoRaWAN con capacidad de almacenamiento local (Buffer) para evitar pérdida de datos durante caídas de red.
- **Formato de Mensaje:** JSON comprimido para optimizar el ancho de banda.
  ```json
  {
    "sensor_id": "SN-TRB-001",
    "timestamp": "2026-05-09T22:00:00Z",
    "payload": {
      "hum_suelo": 18.5,
      "temp_suelo": 28.2,
      "bateria": 85,
      "signal_dbm": -92
    }
  }
  ```

---
*AgroCaribe IA - Integrando la tierra con la nube.*
