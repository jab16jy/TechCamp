-- Insert test user for foreign keys
INSERT INTO usuarios (id, email, nombre, rol) VALUES
  ('00000000-0000-0000-0000-000000000001', 'investigador@techcamp.co', 'Investigador Test', 'investigador')
ON CONFLICT (id) DO NOTHING;

-- Fix: cast sensor_id to uuid in lecturas
INSERT INTO lecturas_sensores (id, sensor_id, ndvi, humedad, temperatura, created_at)
SELECT
  gen_random_uuid(),
  s.id::uuid,
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

-- Fix: parcelas with now-existing user
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
