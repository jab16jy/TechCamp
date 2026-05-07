# 🗄️ Esquema de Base de Datos — AgroCaribe AI

Este documento describe la estructura de datos recomendada para el backend de AgroCaribe AI, optimizada para consultas geoespaciales.

## 1. Configuración Global
*   **Motor**: PostgreSQL 15+
*   **Extensión**: PostGIS (Obligatoria para manejo de mapas)

## 2. Definición de Tablas

### `users`
Almacena la información de los investigadores y administradores.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único. |
| `email` | String (Unique) | Correo electrónico para login. |
| `password_hash` | String | Hash de la contraseña (Argon2). |
| `full_name` | String | Nombre completo. |
| `is_active` | Boolean | Estado de la cuenta. |
| `created_at` | Timestamp | Fecha de registro. |

### `municipalities`
Contiene la delimitación geográfica de los municipios del Caribe.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | Integer (PK) | ID del municipio. |
| `name` | String | Nombre del municipio. |
| `department` | String | Departamento (Atlántico, Bolívar, etc.). |
| `geom` | Geometry(POLYGON, 4326) | **PostGIS Polygon** de los límites. |

### `crops`
Catálogo de cultivos y sus requerimientos agro-climáticos.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | Integer (PK) | ID del cultivo. |
| `name` | String | Nombre (Maíz, Yuca, etc.). |
| `emoji` | String | Icono representativo. |
| `min_temp` | Float | Temperatura mínima ideal. |
| `max_temp` | Float | Temperatura máxima ideal. |
| `min_precip` | Float | Precipitación mínima anual. |
| `ideal_ph_range` | Numrange | Rango de pH óptimo. |
| `growth_days` | Integer | Días promedio de cosecha. |

### `simulations` (Historial)
Registro de todos los análisis realizados por los usuarios.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | ID de la simulación. |
| `user_id` | UUID (FK) | Quién realizó la consulta (opcional para productores). |
| `location` | Geometry(POINT, 4326) | **PostGIS Point** de la consulta. |
| `municipality_id` | Integer (FK) | Link a la tabla de municipios. |
| `climate_data` | JSONB | Snapshot de datos climáticos obtenidos. |
| `satellite_data` | JSONB | Snapshot de NDVI, NDWI, etc. |
| `results` | JSONB | Lista de cultivos recomendados con sus scores. |
| `created_at` | Timestamp | Fecha de la consulta. |

## 3. Consultas Geoespaciales Útiles

### Verificar si una coordenada está en el Caribe
```sql
SELECT name FROM municipalities 
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(-74.7813, 10.9685), 4326));
```

### Obtener simulaciones en un radio de 5km
```sql
SELECT id, created_at FROM simulations
WHERE ST_DWithin(location, ST_SetSRID(ST_Point(-74.7813, 10.9685), 4326), 5000);
```

## 4. Estrategia de Migraciones
Se utilizará **Alembic** para gestionar los cambios de esquema. No se deben hacer cambios manuales en la base de datos de producción.

---

[🏠 Volver a Documentación](../README.md)
