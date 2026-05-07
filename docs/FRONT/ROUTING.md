# 🛣️ Enrutamiento (Routing)

La navegación de la aplicación se gestiona mediante `react-router-dom`.

## 🗺️ Mapa de Rutas

| Ruta | Página | Perfil | Descripción |
| :--- | :--- | :--- | :--- |
| `/` | [[PAGES#Acceso\|Acceso]] | Público | Selección inicial entre Productor e Investigador. |
| `/home` | [[PAGES#Home\|Home]] | Productor | Landing page con información general. |
| `/resultado` | [[PAGES#Resultado\|Resultado]] | Compartido | Visualización de los resultados de un análisis. |
| `/investigador/login` | [[PAGES#Investigador\|Login]] | Investigador | Formulario de acceso para investigadores. |
| `/investigador/dashboard` | [[PAGES#Investigador\|Dashboard]] | Investigador | Panel principal de herramientas avanzadas. |
| `/investigador/analisis` | [[PAGES#Investigador\|Análisis]] | Investigador | Formulario avanzado de simulación de cultivos. |
| `/investigador/resultado-avanzado`| [[PAGES#Investigador\|Resultado Avanzado]] | Investigador | Detalle técnico profundo con mapas satelitales. |

## 🏗️ Layouts

La aplicación utiliza un sistema de layouts definido en `App.jsx`:

1. **LayoutApp**: Incluye `Navbar` y `Footer`. Usado para las rutas de Productor y Landing.
2. **Layout Investigador**: (Interno en las páginas de investigador) Suele tener una barra lateral o un estilo más orientado a panel de control.
3. **Páginas de Acceso**: (`/`, `/investigador/login`) No utilizan el layout estándar para centrar la atención en los formularios de entrada.

## 🔄 Flujo de Navegación Típico

```mermaid
graph LR
    Start[/] --> Prod[Productor]
    Start --> Inv[Investigador]
    
    Prod --> Home[/home]
    Home --> Form[Formulario Consulta]
    Form --> Res[/resultado]
    
    Inv --> Login[/investigador/login]
    Login --> Dash[/investigador/dashboard]
    Dash --> AdvAnalisis[/investigador/analisis]
    AdvAnalisis --> AdvRes[/investigador/resultado-avanzado]
```

---

[[INDEX|⬅️ Volver al Índice]]
