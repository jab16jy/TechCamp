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
