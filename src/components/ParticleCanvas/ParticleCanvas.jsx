// ============================================
// ParticleCanvas — Canvas de partículas animadas
// Efecto antigravity: las partículas se repelen del cursor
// ============================================

import { useEffect, useRef } from 'react';

const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let mouse = { x: -9999, y: -9999 };

    // Ajustar tamaño al contenedor
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Seguimiento del ratón
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Crear partículas
    const NUM = 90;
    const RADIO_REPULSION = 120;
    const FUERZA_REPULSION = 6;

    const particulas = Array.from({ length: NUM }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radio: Math.random() * 2.5 + 0.8,
      // Mezcla de verde, dorado y crema
      color: [
        'rgba(45, 158, 79, ',
        'rgba(232, 184, 75, ',
        'rgba(250, 248, 242, ',
        'rgba(74, 184, 106, ',
      ][Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.6 + 0.15,
      ox: 0, // posición base x
      oy: 0,
    }));

    // Guardar posición original
    particulas.forEach((p) => { p.ox = p.x; p.oy = p.y; });

    // Líneas de conexión entre partículas cercanas
    const DIST_LINEA = 100;

    const dibujar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Actualizar posiciones con repulsión del cursor
      particulas.forEach((p) => {
        // Movimiento orgánico base
        p.x += p.vx;
        p.y += p.vy;

        // Rebotar en bordes
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Repulsión del cursor (antigravity)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RADIO_REPULSION && dist > 0) {
          const fuerza = (RADIO_REPULSION - dist) / RADIO_REPULSION;
          p.x += (dx / dist) * fuerza * FUERZA_REPULSION;
          p.y += (dy / dist) * fuerza * FUERZA_REPULSION;
        }
      });

      // Dibujar líneas de conexión
      for (let i = 0; i < particulas.length; i++) {
        for (let j = i + 1; j < particulas.length; j++) {
          const dx = particulas[i].x - particulas[j].x;
          const dy = particulas[i].y - particulas[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < DIST_LINEA) {
            const opacidad = (1 - dist / DIST_LINEA) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particulas[i].x, particulas[i].y);
            ctx.lineTo(particulas[j].x, particulas[j].y);
            ctx.strokeStyle = `rgba(45, 158, 79, ${opacidad})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Dibujar partículas
      particulas.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(dibujar);
    };

    dibujar();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'all',
      }}
    />
  );
};

export default ParticleCanvas;
