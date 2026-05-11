# Gestión de Estado Global (Contexto)

En lugar de React Context API tradicional, **AgroCaribe IA** utiliza **Zustand** para una gestión de estado más limpia, predecible y de alto rendimiento.

## 🏪 Store Principal: `useAppStore.js`

El almacén central se encuentra en `src/context/useAppStore.js` y orquestra los datos compartidos entre los diferentes módulos.

### 🧩 Estado del Formulario (`formulario`)
Maneja las variables capturadas para el análisis agrícola.
- **Campos:** `departamento`, `municipio`, `lat`, `lng`, `tipo_suelo`, `acceso_riego`, `mes_siembra`, `area_hectareas`, etc.
- **Acciones:** `actualizarFormulario`, `resetearFormulario`.

### 📊 Datos de Análisis (`resultado`)
Almacena la respuesta del motor de IA.
- **Variables:** `resultado` (objeto principal), `cargandoAnalisis` (boolean), `errorAnalisis` (string).
- **Acciones:** `setResultado`, `setCargandoAnalisis`, `setErrorAnalisis`.

### 🔔 Sistema de Notificaciones (`toasts`)
Cola global de mensajes flotantes para feedback del usuario.
- **Acciones:** `agregarToast`, `eliminarToast`.
- **Lógica:** Auto-eliminación después de 4 segundos.

### 🌐 Estado de la API (`apiConectada`)
Indicador global de disponibilidad del backend.

## 🔄 Flujo de Datos

1.  **Captura:** El usuario interactúa con los formularios o el mapa (`AnalysisMap`).
2.  **Actualización:** Los componentes llaman a `actualizarFormulario`.
3.  **Ejecución:** Se llama a `analizarUbicacion` (Service), actualizando `cargandoAnalisis`.
4.  **Sincronización:** Al recibir la respuesta, se actualiza `resultado` y se muestra un `Toast` de éxito.
5.  **Consumo:** Páginas como `Resultado` o `IAPredictiva` se suscriben al store para mostrar la información.

## 💡 Ventajas de esta Implementación
- **Sin Renders Innecesarios:** Solo los componentes que usan una propiedad específica del store se re-renderizan.
- **Sin Providers Anidados:** Se accede al store mediante un hook sencillo sin necesidad de envolver la aplicación en múltiples niveles.
- **Persistencia Sencilla:** Facilita la implementación futura de persistencia en `localStorage`.
