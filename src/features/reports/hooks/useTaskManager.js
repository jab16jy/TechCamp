import { useState } from 'react';

export const NDVI_MONTHS = [
  { month: 'Mar', value: '0.62', delta: '+3%', trend: 'up',   color: '#a3be8c' },
  { month: 'Abr', value: '0.68', delta: '+5%', trend: 'up',   color: '#8fb97a' },
  { month: 'May', value: '0.74', delta: '+7%', trend: 'up',   color: '#6ea055' },
  { month: 'Jun', value: '0.81', delta: '+5%', trend: 'up',   color: '#4d8c3a' },
  { month: 'Jul', value: '0.85', delta: '↑ MÁX', trend: 'max', color: '#166534' },
  { month: 'Ago', value: '0.78', delta: '-8%', trend: 'down', color: '#ca8a04' },
];

export const TASKS = [
  {
    title: 'Ajuste de Riego Sector B',
    desc: 'Detección de saturación en suelo profundo. Reducir 15% el caudal.',
    priority: 'ALTA', priorityClass: 'gr-priority-high',
    icon: 'water_drop',
  },
  {
    title: 'Fertilización Nitrogenada',
    desc: 'Ventana de 48h basada en pronóstico de lluvia leve (NASA POWER).',
    priority: 'MEDIA', priorityClass: 'gr-priority-med',
    icon: 'science',
  },
  {
    title: 'Revisión de Drenaje',
    desc: 'Mantenimiento preventivo en canaleta principal sector sur.',
    priority: 'BAJA', priorityClass: 'gr-priority-low',
    icon: 'plumbing',
  },
];

export default function useTaskManager() {
  const [activeMonth, setActiveMonth] = useState('Jul');
  const [tasks, setTasks] = useState(TASKS.map(() => false));

  const toggleTask = (i) => setTasks((t) => t.map((v, j) => (j === i ? !v : v)));

  const completedCount = tasks.filter(Boolean).length;
  const totalCount = TASKS.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return {
    activeMonth,
    setActiveMonth,
    tasks,
    toggleTask,
    NDVI_MONTHS,
    TASKS,
    completedCount,
    totalCount,
    progressPercent,
  };
}
