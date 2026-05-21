-- ============================================================
-- TEST DATA: sensores, lecturas_sensores, parcelas
-- ============================================================

-- UUIDs fijos para referencias cruzadas
-- Sensor IDs
-- a1111111-1111-1111-1111-111111111111 = Sensor Montería (ok)
-- a2222222-2222-2222-2222-222222222222 = Sensor Barranquilla (ok)
-- a3333333-3333-3333-3333-333333333333 = Sensor Santa Marta (warn)
-- a4444444-4444-4444-4444-444444444444 = Sensor Valledupar (critical)
-- a5555555-5555-5555-5555-555555555555 = Sensor Cartagena (ok)
-- a6666666-6666-6666-6666-666666666666 = Sensor Sincelejo (warn)
--
-- Parcela IDs
-- b1111111-1111-1111-1111-111111111111 = Parcela El Trébol
-- b2222222-2222-2222-2222-222222222222 = Parcela La Esperanza
-- b3333333-3333-3333-3333-333333333333 = Parcela El Porvenir
--
-- Usuario fijo para parcelas
-- 00000000-0000-0000-0000-000000000001 = investigador@techcamp.co

-- 1. SENSORES
INSERT INTO sensores (id, nodo_id, nombre, lat, lng, estado, ubicacion) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'SN-MTR-001', 'Sensor Montería Centro',       8.7578, -75.8814, 'ok',       ST_SetSRID(ST_MakePoint(-75.8814, 8.7578), 4326)),
  ('a2222222-2222-2222-2222-222222222222', 'SN-BAQ-002', 'Sensor Barranquilla Puerto',   10.9685, -74.7813, 'ok',       ST_SetSRID(ST_MakePoint(-74.7813, 10.9685), 4326)),
  ('a3333333-3333-3333-3333-333333333333', 'SN-SM-003',  'Sensor Santa Marta Cerro',     11.2408, -74.1990, 'warn',     ST_SetSRID(ST_MakePoint(-74.1990, 11.2408), 4326)),
  ('a4444444-4444-4444-4444-444444444444', 'SN-VDP-004', 'Sensor Valledupar Valle',      10.4631, -73.2532, 'critical', ST_SetSRID(ST_MakePoint(-73.2532, 10.4631), 4326)),
  ('a5555555-5555-5555-5555-555555555555', 'SN-CTG-005', 'Sensor Cartagena Bocagrande',  10.4000, -75.5140, 'ok',       ST_SetSRID(ST_MakePoint(-75.5140, 10.4000), 4326)),
  ('a6666666-6666-6666-6666-666666666666', 'SN-SNJ-006', 'Sensor Sincelejo Norte',        9.3047, -75.3976, 'warn',     ST_SetSRID(ST_MakePoint(-75.3976, 9.3047), 4326))
ON CONFLICT (id) DO NOTHING;

-- 2. LECTURAS DE SENSORES (últimos 7 días, 3 lecturas diarias por sensor)
INSERT INTO lecturas_sensores (id, sensor_id, ndvi, humedad, temperatura, created_at)
SELECT
  gen_random_uuid(),
  s.id,
  round((random() * 0.5 + 0.2)::numeric, 4),
  round((random() * 40 + 50)::numeric, 1),
  round((random() * 10 + 25)::numeric, 1),
  NOW() - (d || ' days')::INTERVAL - (h || ' hours')::INTERVAL
FROM (VALUES
  ('a1111111-1111-1111-1111-111111111111'),
  ('a2222222-2222-2222-2222-222222222222'),
  ('a3333333-3333-3333-3333-333333333333'),
  ('a4444444-4444-4444-4444-444444444444'),
  ('a5555555-5555-5555-5555-555555555555'),
  ('a6666666-6666-6666-6666-666666666666')
) AS s(id)
CROSS JOIN (SELECT generate_series(0, 6) AS d) AS days
CROSS JOIN (SELECT generate_series(0, 2) * 8 AS h) AS hours;

-- 3. PARCELAS
INSERT INTO parcelas (id, usuario_id, nombre, area_hectareas, poligono) VALUES
  ('b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001',
   'El Trébol', 12.5,
   ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(-75.88 8.75, -75.87 8.75, -75.87 8.76, -75.88 8.76, -75.88 8.75)')), 4326)),
  ('b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001',
   'La Esperanza', 8.3,
   ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(-74.79 10.96, -74.78 10.96, -74.78 10.97, -74.79 10.97, -74.79 10.96)')), 4326)),
  ('b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001',
   'El Porvenir', 20.0,
   ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(-75.52 10.39, -75.51 10.39, -75.51 10.41, -75.52 10.41, -75.52 10.39)')), 4326))
ON CONFLICT (id) DO NOTHING;

-- 4. MÁS ANÁLISIS DE PRUEBA PARA DASHBOARD
INSERT INTO analisis (id, usuario_id, municipio_id, tipo, datos_formulario, resultado_completo, lat, lng, cultivo_recomendado, score, created_at)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', NULL, 2, 'analisis',
   '{"cultivo": "Platano", "municipio": "Barranquilla", "ph": 6.5}'::jsonb,
   '{"score": 88, "riesgo": "bajo"}'::jsonb,
   10.9685, -74.7813, 'Plátano', 88, NOW() - INTERVAL '3 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', NULL, 3, 'simple',
   '{"cultivo": "Algodon", "municipio": "Cartagena", "ph": 7.0}'::jsonb,
   '{"score": 72, "riesgo": "medio"}'::jsonb,
   10.4000, -75.5140, 'Algodón', 72, NOW() - INTERVAL '5 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', NULL, 7, 'advanced',
   '{"municipio": "Sincelejo", "ph": 6.8, "materia_organica": "4.2"}'::jsonb,
   '{"score": 91, "calidad": "Alta"}'::jsonb,
   9.3047, -75.3976, 'Maíz', 91, NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;
