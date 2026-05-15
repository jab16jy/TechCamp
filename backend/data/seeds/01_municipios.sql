CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS municipios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL
);

INSERT INTO municipios (id, nombre, departamento) VALUES
    (1, 'Barranquilla', 'Atlántico'),
    (2, 'Soledad', 'Atlántico'),
    (3, 'Cartagena', 'Bolívar'),
    (4, 'Santa Marta', 'Magdalena'),
    (5, 'Montería', 'Córdoba'),
    (6, 'Valledupar', 'Cesar'),
    (7, 'Sincelejo', 'Sucre'),
    (8, 'Riohacha', 'La Guajira')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS indices_satelitales (
    id SERIAL PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    ndvi DOUBLE PRECISION,
    ndwi DOUBLE PRECISION,
    calidad_suelo VARCHAR(50),
    cobertura_nube INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO indices_satelitales (id, lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube) VALUES
    (1, 10.97, -74.78, 0.45, 0.20, 'Media-Alta', 10),
    (2, 10.92, -74.76, 0.38, 0.15, 'Media', 15),
    (3, 10.40, -75.51, 0.52, 0.25, 'Alta', 8),
    (4, 11.24, -74.20, 0.48, 0.22, 'Media-Alta', 12),
    (5, 8.76,  -75.88, 0.55, 0.30, 'Alta', 5),
    (6, 10.46, -73.25, 0.41, 0.18, 'Media', 18),
    (7, 9.30,  -75.40, 0.47, 0.21, 'Media-Alta', 10),
    (8, 11.54, -72.91, 0.33, 0.12, 'Media-Baja', 22)
ON CONFLICT (id) DO NOTHING;
