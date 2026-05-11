# Configuración y Ejecución

Guía para preparar el entorno de desarrollo e iniciar el frontend de **AgroCaribe IA**.

## 📋 Requisitos Previos

- **Node.js:** Versión 18.0.0 o superior.
- **npm:** Versión 9.0.0 o superior.

## 🛠️ Instalación

1.  Clonar el repositorio.
2.  Navegar a la carpeta del proyecto.
3.  Instalar dependencias:
    ```bash
    npm install
    ```

## 🚀 Ejecución en Local

Para iniciar el servidor de desarrollo con recarga en caliente:

```bash
npm run dev
```

La aplicación estará disponible por defecto en `http://localhost:5173`.

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (basado en `.env.example` si existe) con las siguientes variables:

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL base del backend (FastAPI). | `http://localhost:8000` |

*Nota: Si la API no está disponible, el sistema activará automáticamente el modo de datos simulados (Mock).*

## 📦 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia Vite en modo desarrollo. |
| `npm run build` | Genera el bundle optimizado para producción en `dist/`. |
| `npm run lint` | Ejecuta ESLint para verificar errores de código. |
| `npm run preview` | Previsualiza la build de producción localmente. |

## 🌐 Despliegue (Wrangler)
El proyecto incluye configuración para **Cloudflare Pages** via `wrangler.toml`.
```bash
npx wrangler pages deploy dist
```
