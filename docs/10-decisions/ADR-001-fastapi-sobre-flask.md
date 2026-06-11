# ADR-001: FastAPI sobre Flask

## Contexto

Necesitábamos un framework web para el backend REST del sistema AgroCaribe AI. Los endpoints debían manejar concurrencia (múltiples análisis simultáneos), integrar validación de datos robusta, y generar documentación de API consumible directamente por el frontend. Flask era la alternativa principal: conocido, maduro, con gran ecosistema.

Sin embargo, Flask es síncrono por defecto —requiere extensiones externas (Gevent, Quart) para async— y su validación depende de libraries independientes como Marshmallow o Pydantic por separado, sin integración nativa con OpenAPI.

## Decisión

**FastAPI 0.115+**, usando `uvicorn[standard]` como servidor ASGI.

Las razones:

1. **Rendimiento async nativo** — FastAPI corre sobre Starlette (ASGI), maneja requests concurrentes sin bloquear el event loop. Crítico para endpoints IO-bound como `/analyze-location` (llama a OpenMeteo + ISRIC SoilGrids + inferencia ML).
2. **Validación automática con Pydantic v2** — Los schemas de request/response (25+ endpoints, 15 schemas) se validan y documentan automáticamente. Sin Marshmallow, sin esquemas duplicados.
3. **OpenAPI interactivo** — `/docs` (Swagger UI) y `/redoc` generados automáticamente. El frontend usó Swagger para debuggear contratos durante el desarrollo sin necesidad de mock server.
4. **Tipado nativo** — Type hints + Pydantic = detección temprana de errores de tipo en los schemas. La mayoría de bugs de serialización se capturan en compile-time.
5. **Dependencias DI** — FastAPI `Depends()` con `get_db` y `get_current_user` simplifica la inyección de dependencias sin frameworks externos.

## Consecuencias

**Positivas:**
- + Documentación automática de API (Swagger en `/docs`) que el frontend usó como referencia viva
- + Validación consistente: todos los endpoints siguen el mismo patrón Pydantic → error 422 descriptivo automático
- + Rendimiento async: el endpoint POST /analyze-location corre 3 llamadas externas en paralelo sin bloquear
- + Integración con SQLAlchemy async (asyncpg): sin bloqueos en consultas DB
- + Comunidad activa, ecosistema creciente para 2025-2026

**Negativas:**
- - Curva de aprendizaje inicial para async/await comparado con Flask síncrono
- - Menos tutoriales en español que Flask (aunque documentación oficial es excelente)
- - Ecosistema de extensiones más pequeño (Flask tiene Flask-SQLAlchemy, Flask-Login, etc.)

## Referencias

- [[03-architecture/backend.md]]
- [[04-development/setup.md]]
- [[06-api/referencia.md]]
