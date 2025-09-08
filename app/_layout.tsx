import AsyncStorage from '@react-native-async-storage/async-storage';
// Layout raíz de la app
// - Monta el ThemeProvider de React Navigation
// - Carga fuentes y espera estado de autenticación
// - Redirige a stacks: (drawer) si logueado, (auth) si no
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { NavigationTheme } from '@/constants/theme';

// Hook interno: consulta token en AsyncStorage y expone estado de auth
function useAuthStatus() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        setIsLoggedIn(!!token);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { isLoading, isLoggedIn };
}

// Componente raíz: prepara fuentes y resuelve qué stack renderizar
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isLoading, isLoggedIn } = useAuthStatus();

  // Mientras carga fuentes o estado de auth, no renderiza UI
  if (!loaded || isLoading) {
    return null;
  }

  // Estructura de navegación: esconde header a nivel de stack raíz
  return (
    <ThemeProvider value={NavigationTheme as any}>
      <Stack screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="(drawer)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
