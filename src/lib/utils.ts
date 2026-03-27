import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMonthRange(month: string): { startDate: string; endDate: string } {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const m = Number(monthStr);
  const startDate = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const endDate = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}
