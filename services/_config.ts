// Centraliza la base de URL de la API leyendo variables de entorno expuestas por Expo
// Prioridad:
// 1) EXPO_PUBLIC_API_URL (se inyecta en tiempo de build y está disponible en runtime)
// 2) expo-constants extra.apiUrl (si has configurado app.config.ts con extra)
// 3) fallback por defecto (ajústalo según tu entorno local)

import Constants from 'expo-constants';

export function getApiBase(): string {
  // Expo soporta variables públicas con prefijo EXPO_PUBLIC_
  // Estas quedan embebidas en el bundle de JS y disponibles como process.env
  const fromEnv = (process.env as any)?.EXPO_PUBLIC_API_URL as string | undefined;
  const fromExtra = (Constants.expoConfig?.extra as any)?.apiUrl as string | undefined;

  // Asigna a 'base' el primer valor disponible entre:
  // 1. 'fromEnv' (si no es null ni undefined)
// 2. 'fromExtra' (si no es null ni undefined y 'fromEnv' lo es)
// 3. 'EXPO_PUBLIC_API_URL' del objeto de entorno de Node.js
  const base = fromEnv ?? fromExtra ?? (process.env as any)?.EXPO_PUBLIC_API_URL;
  // Normaliza: sin slash final
  return base.replace(/\/$/, '');
}

export const API_BASE = getApiBase();
