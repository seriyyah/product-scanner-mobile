import { theme } from '../constants/theme';

export function gradeColor(grade: string): string {
  switch (grade?.toUpperCase()) {
    case 'A':
    case 'B':
      return theme.colors.safetyGood;
    case 'C':
      return theme.colors.safetyMedium;
    default:
      return theme.colors.safetyPoor;
  }
}

export function gradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    A: 'Excellent',
    B: 'Good',
    C: 'Moderate',
    D: 'Poor',
    E: 'Bad',
    F: 'Very Bad',
  };
  return labels[grade?.toUpperCase()] || 'Unknown';
}

export function novaLabel(group: number): string {
  const labels: Record<number, string> = {
    1: 'Minimally processed',
    2: 'Culinary ingredient',
    3: 'Processed',
    4: 'Ultra-processed',
  };
  return labels[group] || 'Unknown';
}
