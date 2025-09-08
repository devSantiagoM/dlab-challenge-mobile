// Centralized design system for the app
// Colors are inspired by the provided mockups (dark navy header, blue primary, light surfaces)
import { DefaultTheme, type Theme } from '@react-navigation/native';

export const Palette = {
  // Brand
  primary: '#2D6BFF',
  primaryDark: '#1F4FCC',
  // Greys / text
  text: '#0F162B',
  textMuted: '#5B6275',
  border: '#E6EAF2',
  // Surfaces
  surface: '#FFFFFF',
  background: '#F5F7FB', // app background
  // Header / navbar
  header: '#0E1B3D', // dark navy
  // Login gradient stops
  gradientFrom: '#0F1636',
  gradientTo: '#1B2454',
  // Status
  success: '#2FB66B',
  danger: '#E5484D',
  warning: '#FFB224',
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const Typography = {
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Palette.text,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textMuted,
  },
} as const;

// React Navigation theme object
// IMPORTANT: Base on DefaultTheme so required keys like `fonts.bold` exist (used by HeaderTitle)
export const NavigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Palette.primary,
    background: Palette.background,
    card: Palette.surface,
    text: Palette.text,
    border: Palette.border,
    notification: Palette.primary,
  },
};
