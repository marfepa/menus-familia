import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DayOfWeek } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Obtener la fecha del lunes de la semana dada una fecha o la actual
export function getMonday(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  // Domingo es 0, Lunes es 1
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Formatear rango de semana (ej. "14 - 20 Octubre 2026")
export function formatWeekRange(mondayIso: string): string {
  const [year, month, day] = mondayIso.split('-').map(Number);
  const monday = new Date(year, month - 1, day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  return `${monday.getDate()} ${months[monday.getMonth()]} - ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

export function getRelativeWeekMonday(offsetWeeks: number, currentMondayIso: string): string {
  const [year, month, day] = currentMondayIso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offsetWeeks * 7);
  return date.toISOString().split('T')[0];
}
