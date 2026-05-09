# AgroCaribe IA: Módulo de Inteligencia Artificial Predictiva

## 1. Visión de la IA Predictiva
En AgroCaribe, la IA no solo recomienda qué sembrar, sino que actúa como una **ventana al futuro**. Su objetivo es proporcionar al agricultor una hoja de ruta clara sobre lo que sucederá con su cultivo una vez plantado, permitiéndole anticiparse a los desafíos climáticos y de mercado.

---

## 2. Pilares de la Capacidad Predictiva

### 2.1 Estimación de Rendimiento (Yield Prediction)
Utilizando datos históricos de **NASA POWER** y características específicas de la parcela:
*   **Variables:** Área, tipo de suelo (textura), pH y nutrientes.
*   **Resultado:** Predicción de toneladas por hectárea proyectadas al final del ciclo.

### 2.2 Detección Anticipada de Riesgos
Análisis de patrones climáticos a corto y mediano plazo para identificar:
*   **Ventanas de Sequía:** Alertas de estrés hídrico.
*   **Exceso de Lluvia:** Predicción de condiciones favorables para patógenos (ej. hongos por alta humedad).

### 2.3 Simulador de Escenarios ("¿Qué pasaría si...?")
Permite al usuario experimentar con variables críticas antes de actuar:
*   **Temporalidad:** "¿Qué pasa si siembro 15 días después?"
*   **Nutrición:** "¿Qué pasa si aplico un 10% más de fertilizante?"
*   **Impacto:** El sistema recalcula automáticamente el puntaje de éxito y el rendimiento estimado.

---

## 3. Agro-Asesor: Chatbot Contextual
Un ingeniero agrónomo digital disponible 24/7 que responde basado en **datos reales**, no generalidades.

*   **Conciencia Contextual:** Si el usuario pregunta por el crecimiento lento, la IA analiza el último índice **NDVI** y los niveles de **Nitrógeno** registrados.
*   **Ejemplo de Respuesta:** *"Tu maíz tiene un vigor bajo (NDVI 0.42) probablemente porque el nivel de Nitrógeno en Turbaco está por debajo de los 42 mg/kg ideales."*
*   **Interfaz Humana:** Botón flotante con soporte para **consultas por voz**, facilitando el uso en pleno campo.

---

## 4. Ciclo de Acompañamiento (Horizonte de 6 Meses)
Optimizado para cultivos transitorios del Caribe (Maíz, Yuca, Tubérculos).

| Periodo | Función de la IA Predictiva | Beneficio para el Campesino |
| :--- | :--- | :--- |
| **Mes 1-2** | **Predicción de Germinación** | Alertas sobre heladas o inundaciones que afecten la semilla. |
| **Mes 3-4** | **Optimización de Insumos** | Predice el momento exacto de mayor demanda de nutrientes. |
| **Mes 5-6** | **Ventana de Cosecha** | Identifica los 5 días con menor probabilidad de lluvia para una recolección seca. |

---

## 5. Recomendaciones de Diseño y UX

### 5.1 Filosofía "Offline First"
El sistema permite la carga de datos localmente. La sincronización con **NASA POWER** y **Sentinel-2** ocurre automáticamente cuando se detecta conexión, garantizando utilidad en zonas remotas.

### 5.2 Lenguaje Visual Intuitivo
Se eliminan los tecnicismos complejos para el usuario final, traduciendo índices (NDWI, NDVI) a un sistema de colores semafórico:
*   🟢 **Verde:** Éxito / Óptimo.
*   🟡 **Amarillo:** Precaución / Ajuste necesario.
*   🔴 **Rojo:** Riesgo / Alerta crítica.

### 5.3 Alertas Push Preventivas
La IA es proactiva: *"Hola, detectamos una ola de calor en Magdalena en 3 días; aumenta el riego un 15% mañana."*

### 5.4 Integración con Mapas Futuros
La sección de ubicación "pintará" el mapa con una proyección visual de cómo se verá la vegetación en el futuro, basándose en el modelo de crecimiento seleccionado.
