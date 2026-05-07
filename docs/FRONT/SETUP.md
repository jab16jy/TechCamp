# 🚀 Guía de Configuración (Setup)

Sigue estos pasos para poner en marcha el proyecto en tu entorno local.

## 📋 Prerrequisitos

- **Node.js** (v16 o superior recomendado)
- **npm** o **yarn**
- Conexión a internet (para descargar dependencias y cargar mapas/imágenes)

## 🛠️ Instalación

1. **Clonar el repositorio** (o abrir la carpeta del proyecto).
2. **Instalar dependencias**:
   ```bash
   npm install
   ```
3. **Configurar variables de entorno**:
   Crea un archivo `.env` en la raíz (si no existe) y define la URL del API (opcional):
   ```env
   VITE_API_URL=http://localhost:8000
   ```
   *Nota: Si el API no está disponible, el sistema usará automáticamente [[SERVICES#Mocks|Datos Mock]].*

## 🏃 Ejecución

Para iniciar el servidor de desarrollo:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173` (o el puerto que asigne Vite).

## 🏗️ Construcción para Producción

Para generar los archivos optimizados para despliegue:
```bash
npm run build
```
Los archivos se generarán en la carpeta `/dist`.

---

## 🔑 Cuentas de Prueba (Mocks)

Actualmente, como el sistema es mayormente Frontend, puedes usar cualquier credencial en el login de investigador o simplemente avanzar en los flujos, ya que la validación es simulada en esta etapa.

---

[[INDEX|⬅️ Volver al Índice]]
