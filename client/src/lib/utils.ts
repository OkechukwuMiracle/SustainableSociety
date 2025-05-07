import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const getLoginStatusColor = (status: string): string => {
  switch (status) {
    case 'early':
      return 'bg-success text-white';
    case 'ontime':
      return 'bg-warning text-white';
    case 'late':
      return 'bg-danger text-white';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
};

export const getLoginStatusText = (status: string): string => {
  switch (status) {
    case 'early':
      return 'Early Login';
    case 'ontime':
      return 'On Time';
    case 'late':
      return 'Late Login';
    default:
      return 'Unknown';
  }
};

export const calculateDuration = (
  startTime: string | Date,
  endTime?: string | Date | null
): string => {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  
  const durationMs = end - start;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

export const calculatePercentage = (achieved: number, target: number): number => {
  if (target === 0) return 0;
  return Math.round((achieved / target) * 100);
};
