# 🛠️ Solución de Problemas (Troubleshooting)

Guía para resolver errores comunes durante el desarrollo o uso de la aplicación.

## 📡 Conexión con el Backend

### El indicador del Navbar dice "API Desconectada"
- **Causa**: El servidor FastAPI no está corriendo o la URL en `.env` es incorrecta.
- **Solución**:
    1. Verifica que el backend esté activo en el puerto 8000.
    2. Comprueba que `VITE_API_URL` en tu archivo `.env` coincida con la dirección del servidor.
    3. La aplicación seguirá funcionando usando **Mocks**, pero los datos no serán reales.

## 🗺️ Problemas con Mapas

### El mapa no carga o se ve gris
- **Causa**: Problemas de conexión con el proveedor de tiles (OpenStreetMap) o error en la carga de la librería Leaflet.
- **Solución**: Revisa la consola del navegador por errores de `403` o `404` en la carga de imágenes del mapa. Asegúrate de tener conexión a internet.

## 📦 Dependencias

### Errores al ejecutar `npm run dev`
- **Causa**: Dependencias mal instaladas o versiones incompatibles.
- **Solución**:
    ```bash
    rm -rf node_modules package-lock.json
    npm install
    ```

## 🎨 Estilos (CSS)

### Los cambios en `index.css` no se reflejan
- **Causa**: Caché del navegador o Vite.
- **Solución**: Reinicia el servidor de desarrollo (`Ctrl+C` y `npm run dev`) y limpia la caché del navegador (`Ctrl+F5`).

---

[[INDEX|⬅️ Volver al Índice]]
