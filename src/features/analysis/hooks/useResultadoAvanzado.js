import { useState, useEffect, useCallback } from 'react';

export default function useResultadoAvanzado() {
  const [rain, setRain] = useState(50);
  const [fert, setFert] = useState(50);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 900);
    return () => clearInterval(id);
  }, []);

  const handleRainChange = useCallback((e) => setRain(+e.target.value), []);
  const handleFertChange = useCallback((e) => setFert(+e.target.value), []);

  return {
    rain,
    fert,
    pulse,
    handleRainChange,
    handleFertChange,
  };
}
