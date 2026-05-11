# Resolución de Problemas (Troubleshooting)

Guía rápida para diagnosticar y solucionar errores comunes en el desarrollo del frontend.

## 🎨 Estilos y Tailwind CSS

### Problema: Los estilos de Tailwind no se aplican.
- **Causa:** El servidor de desarrollo no ha detectado cambios o `postcss` falló.
- **Solución:** 
    1. Reinicia el servidor (`npm run dev`).
    2. Verifica que el archivo esté incluido en `content` dentro de `tailwind.config.js`.
    3. Asegúrate de que `index.css` tenga las directivas `@tailwind base;`, etc.

### Problema: Fuentes desalineadas o íconos no cargan.
- **Solución:** Verifica que el `index.html` tenga los links correctos a Google Fonts y Material Symbols.

## 🧭 Rutas y Navegación

### Problema: La página se queda en blanco al navegar.
- **Causa:** Error en la definición de la ruta en `App.jsx` o componente que no exporta `default`.
- **Solución:** Revisa la consola del navegador. Si hay un error de "matching route", verifica los paths en el componente `<Routes>`.

### Problema: 404 inesperado en despliegue.
- **Causa:** El servidor web no está configurado para manejar Single Page Applications (SPA).
- **Solución:** Asegúrate de tener un archivo de redirección (ej. `_redirects` en Netlify o configuración de fallback en Cloudflare/Wrangler).

## 📡 Datos y API

### Problema: El sistema siempre muestra datos simulados (Mock).
- **Causa:** El frontend no puede alcanzar el backend o la variable `VITE_API_URL` está mal configurada.
- **Solución:** 
    1. Revisa que el backend esté corriendo en el puerto indicado.
    2. Verifica el archivo `.env`.
    3. Revisa la pestaña "Network" del navegador para ver el estado de las peticiones.

### Problema: Error de CORS al llamar a la API.
- **Causa:** El backend no permite peticiones desde el dominio del frontend.
- **Solución:** Configura los middlewares de CORS en el backend (FastAPI) para permitir el origen del frontend.

## 📦 Dependencias

### Problema: Errores de "Module not found".
- **Solución:** Ejecuta `npm install` para asegurar que todas las librerías estén instaladas correctamente. Borra `node_modules` y reinstala si el error persiste.
