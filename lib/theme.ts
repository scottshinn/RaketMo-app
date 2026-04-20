export const theme = {
  colors: {
    bgBase: '#0d0f14',
    bgSurface: '#161920',
    bgCard: '#1c2028',
    bgElevated: '#232832',
    border: 'rgba(255,255,255,0.07)',
    borderActive: 'rgba(99,179,237,0.35)',
    blue: '#4fa8f5',
    blueDim: 'rgba(79,168,245,0.12)',
    blueGlow: 'rgba(79,168,245,0.3)',
    amber: '#f6ad55',
    amberDim: 'rgba(246,173,85,0.13)',
    green: '#48bb78',
    greenDim: 'rgba(72,187,120,0.12)',
    red: '#fc8181',
    redDim: 'rgba(252,129,129,0.12)',
    textPrimary: '#f0f4f8',
    textSecondary: '#8a95a3',
    textMuted: '#4a5568',
  },
  typography: {
    fontDisplay: 'Poppins_800ExtraBold',
    fontBody: 'Poppins_400Regular',
    fontBodyMedium: 'Poppins_500Medium',
    fontBodySemiBold: 'Poppins_600SemiBold',
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
  },
} as const;

export type Theme = typeof theme;

export function useTheme(): Theme {
  return theme;
}
