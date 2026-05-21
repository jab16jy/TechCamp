INSERT INTO analisis (id, usuario_id, municipio_id, tipo, datos_formulario, resultado_completo, lat, lng, cultivo_recomendado, score, created_at)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 1, 'analisis', '{"cultivo": "Maiz", "ph": 6.2, "materia_organica": "3.5", "textura": "Franco", "mes_siembra": "Marzo"}'::jsonb, '{"score": 94}'::jsonb, 10.9685, -74.7813, 'Maiz', 94, NOW() - INTERVAL '2 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NULL, 5, 'analisis', '{"cultivo": "Yuca", "ph": 6.8, "materia_organica": "4.1", "textura": "Arcilloso", "mes_siembra": "Abril"}'::jsonb, '{"score": 88}'::jsonb, 8.7578, -75.8814, 'Yuca', 88, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
