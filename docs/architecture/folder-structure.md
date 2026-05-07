# 📁 Folder Structure

The project follows a clean, modular structure typical of modern React applications, with a strict separation between UI components, business logic, and assets.

## 📂 Root Directory

```text
agrocaribe-ia/
├── docs/               # 📚 Technical documentation
├── public/             # 🌐 Static assets (robots.txt, favicon)
├── src/                # 💻 Source code
│   ├── assets/         # 🖼️ Images, icons, and static data
│   ├── components/     # 🧩 Shared UI components (Atomic design)
│   ├── context/        # 🧠 Zustand store & global state
│   ├── pages/          # 📄 Route-level page components
│   ├── services/       # 🔌 API clients and external services
│   ├── App.jsx         # 🛣️ Router definition & main wrapper
│   ├── main.jsx        # 🚀 Entry point
│   └── index.css       # 🎨 Global styles & design tokens
├── .env                # 🔑 Environment variables
├── index.html          # 🏗️ HTML template
├── package.json        # 📦 Dependencies and scripts
└── vite.config.js      # ⚙️ Vite configuration
```

## 🧩 Component & Page Pattern
We follow the **Folder-per-Component** pattern. Each component or page has its own directory:

```text
src/components/MyComponent/
├── MyComponent.jsx     # Logic and JSX
└── MyComponent.css     # (Optional) Specific styles
```

## 🔍 Key Directories

### `src/context/`
Contains `useAppStore.js`, which is the "Source of Truth" for the application state. It uses Zustand to avoid prop-drilling.

### `src/services/`
Contains `api.js`. All external communication happens here. It includes the mock data used during backend outages.

### `src/pages/`
Each folder represents a route in `App.jsx`.
*   `Acceso`: Profile selection.
*   `Home`: Landing page.
*   `Consulta`: Map and location selection.
*   `Resultado`: Analysis display.
*   `Historial`: Past queries.
*   `Investigador`: Dashboard and login for researchers.

---

[⬅️ Back to Architecture Overview](overview.md) | [Home 🏠](../README.md)
