# Futuras Mejoras Técnicas

Roadmap de optimizaciones y funcionalidades planeadas para elevar la calidad técnica del frontend de **AgroCaribe IA**.

## 🛠️ Optimización y Rendimiento
- **Code Splitting:** Implementar `React.lazy` y `Suspense` para cargar las páginas del investigador solo cuando sea necesario, reduciendo el bundle inicial.
- **Image Optimization:** Implementar formatos modernos (WebP) y lazy loading para assets de gran tamaño en la landing page.
- **Memoización:** Refinar el uso de `useMemo` y `useCallback` en los componentes de gráficos complejos (Radar, Gauges) para evitar re-renders costosos.

## 📱 Experiencia de Usuario (UX/UI)
- **Modo Offline:** Implementar Service Workers para permitir la consulta de datos cacheados en zonas rurales con baja conectividad.
- **Soporte Mobile:** Aunque los dashboards son de alta densidad para desktop, se planea una vista simplificada para tablets y smartphones.
- **Accesibilidad (a11y):** Auditoría completa de contraste, etiquetas ARIA y navegación por teclado en los formularios de consulta.

## 🧪 Calidad de Software
- **Testing Unitario:** Introducir **Vitest** y **React Testing Library** para asegurar que la lógica de los servicios y el store de Zustand sea robusta.
- **E2E Testing:** Implementar pruebas de flujo completo (Selección de mapa -> Análisis -> Resultado) con **Playwright**.
- **TypeScript:** Migración progresiva de `.jsx` a `.tsx` para mejorar la seguridad de tipos en la gestión de datos de IA.

## 🌐 Funcionalidades de Datos
- **Persistencia Local:** Sincronizar el store de Zustand con `localStorage` para que el usuario no pierda su progreso en los formularios al refrescar.
- **Exportación Avanzada:** Implementar la generación de PDF del lado del cliente (`jspdf`) para los reportes de `GestionReportes`.
- **Integración Real de API:** Transición completa de datos Mock a endpoints de producción una vez el backend esté desplegado.
