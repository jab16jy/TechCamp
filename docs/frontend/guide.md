# 🎨 Frontend Guide

The frontend is a premium React 19 application built with speed and aesthetics in mind.

## 🛠️ Core Technologies
*   **React 19**: Utilizing the latest features for efficient rendering.
*   **Vite 8**: Lightning-fast build tool and dev server.
*   **Zustand**: Minimalist state management.
*   **Leaflet**: The industry standard for interactive maps.

## 💅 Design System: "Organic Lab"
The visual identity of AgroCaribe AI is defined in `src/index.css`. It uses **CSS Custom Properties (Variables)** to maintain consistency.

### Key Tokens
*   **Colors**:
    *   `--primary`: Deep jungle green (#064e3b).
    *   `--accent`: Vibrant agricultural lime (#84cc16).
    *   `--surface`: Soft laboratory gray (#f8fafc).
*   **Typography**:
    *   **Titles**: `Fraunces` (Serif) for a professional, editorial look.
    *   **Body**: `DM Sans` (Sans-serif) for high legibility.

## 🏗️ State Management Flow
We use Zustand to manage global state. The store is accessed via the `useAppStore` hook.

```javascript
import useAppStore from '../context/useAppStore';

const MyComponent = () => {
  const { results, setSelection } = useAppStore();
  // ...
};
```

## 🗺️ Map Integration
The `Consulta` page integrates **Leaflet** via `react-leaflet`.
*   **Tile Provider**: OpenStreetMap (Standard) or Esri World Imagery (Satellite).
*   **Interaction**: Users click on the map to set the `lat/lng` in the Zustand store.

## 🛣️ Routing
Defined in `src/App.jsx`. We use a `LayoutApp` wrapper for user routes and separate layouts for the `Investigador` portal.

| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `Acceso` | Profile selection |
| `/home` | `Home` | Landing page |
| `/consulta` | `Consulta` | Map & Form selection |
| `/resultado` | `Resultado` | Results & Analysis |
| `/historial` | `Historial` | User search history |
| `/investigador/*` | `Investigador` | Research portal |

---

[🏠 Back to Home](../README.md)
