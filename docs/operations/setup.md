# 🚀 Setup & Installation

Follow these steps to get the AgroCaribe AI development environment running on your local machine.

## 📋 Prerequisites
*   **Node.js**: v18.0.0 or higher.
*   **npm**: v9.0.0 or higher.
*   **Git**: For version control.

## 🛠️ Installation Steps

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/agrocaribe-ia.git
    cd agrocaribe-ia
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment**:
    Create a `.env` file in the root directory (copy from `.env.example` if available).
    ```bash
    cp .env.example .env
    ```

4.  **Start development server**:
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:5173](http://localhost:5173).

## 🧪 Running with Backend
If you have the FastAPI backend running:
1.  Ensure the backend is live at `http://localhost:8000`.
2.  Update `VITE_API_URL` in your `.env` to point to the backend address.

## 🧹 Linting
To check for code style and potential errors:
```bash
npm run lint
```

## 📦 Building for Production
To generate the optimized distribution files:
```bash
npm run build
```
The output will be in the `dist/` directory.

---

[🏠 Back to Home](../README.md)
