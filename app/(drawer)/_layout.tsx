// Layout del Drawer (navegación lateral)
// - Define el contenido personalizado del Drawer (header con logo, lista de items, panel de usuario, logout)
// - Configura estilos y comportamiento del Drawer (tipo, ancho, colores, accesibilidad)
import { Palette, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView, DrawerItemList, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Contenido personalizado del Drawer: logo, navegación y perfil de usuario
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const [user, setUser] = React.useState<{ name: string; email: string; avatar?: string } | null>(null);
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const insets = useSafeAreaInsets();

  // Carga datos básicos del usuario guardados en AsyncStorage
  React.useEffect(() => {
    const load = async () => {
      const u = await AsyncStorage.getItem('auth_user');
      if (u) setUser(JSON.parse(u));
    };
    load();
  }, []);

  // Cerrar sesión: limpia credenciales y redirige a login
  const onLogout = async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    router.replace('/(auth)/login');
  };

  // Estructura del Drawer: logo arriba, luego items, panel de usuario y botón de logout
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.sm,
        paddingBottom: insets.bottom + Spacing.sm,
        backgroundColor: '#0F1636',
      }}
    >
      {/* Header con logo de dTalent */}
      <View style={[styles.header, { backgroundColor: '#0F1636', borderColor: 'rgba(255,255,255,0.08)' }]}>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm }}>
          <Image
            source={require('../../assets/images/dTalentLogo.webp')}
            style={{ width: 150, height: 44 }}
            resizeMode="contain"
          />
        </View>
      </View>
      <View style={[styles.drawerContainer, { backgroundColor: '#2A2F52', borderColor: 'rgba(255,255,255,0.12)' }]}>
        <DrawerItemList {...props} />
      </View>
      {/* Panel de usuario por encima del botón de Cerrar sesión */}
      <View style={{ backgroundColor: '#2A2F52', marginHorizontal: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
        <View style={[styles.userRow, isPhone && { alignItems: 'flex-start' }]}>
          <Image
            source={user?.avatar ? { uri: user.avatar } : require('../../assets/images/icon.png')}
            style={[styles.avatar, isPhone && { width: 36, height: 36, borderRadius: 18, marginTop: 2 }]}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: '#fff' }, isPhone && { fontSize: 14 }]} numberOfLines={1}>
              {user?.name ?? 'Usuario'}
            </Text>
            {!!user?.email && (
              <Text style={[styles.userEmail, { color: '#C6CBF3' }, isPhone && { fontSize: 11 }]} numberOfLines={1}>
                {user?.email}
              </Text>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: '#2A2F52', borderColor: 'rgba(255,255,255,0.12)' }]} onPress={onLogout}>
        <Text style={[styles.logoutText, { color: '#FFB4B4' }]}>Cerrar sesión</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

// Configuración del Drawer (alto nivel): tipo, anchos responsivos y colores
export default function DrawerLayout() {
  const { width } = useWindowDimensions();
  // Responsive drawer widths
  const drawerWidth = width >= 1024 ? 360 : width >= 768 ? 320 : 280;
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isPhone = width < 768;
  // Keep hamburger (toggle) on all sizes. Use 'slide' on desktop instead of 'permanent'.
  const drawerType = isDesktop ? 'slide' : isTablet ? 'slide' : 'front';
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        drawerType: drawerType as any,
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: Palette.header },
        headerTintColor: '#fff',
        headerTitleStyle: { color: '#fff' },
        drawerStyle: { backgroundColor: '#0F1636', width: drawerWidth },
        drawerActiveTintColor: '#FFFFFF',
        drawerInactiveTintColor: '#C6CBF3',
        drawerActiveBackgroundColor: '#1B2454',
        drawerInactiveBackgroundColor: 'transparent',
        drawerLabelStyle: { fontWeight: '600' },
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 8 },
        swipeEnabled: !isDesktop, // mouse users will click the hamburger
        drawerHideStatusBarOnOpen: isPhone,
        sceneStyle: { backgroundColor: Palette.background },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={{ paddingLeft: Spacing.md, paddingVertical: 6 }}
            accessibilityLabel="Abrir o cerrar menú"
            accessibilityRole="button"
          >
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ paddingRight: Spacing.md }}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </View>
        ),
      })}
    >
      <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="employees" options={{ title: 'Empleados' }} />
      <Drawer.Screen name="receipts" options={{ title: 'Recibos' }} />
      <Drawer.Screen name="communication" options={{ title: 'Comunicación' }} />
      <Drawer.Screen name="settings" options={{ title: 'Configuración' }} />
    </Drawer>
  );
}

// Estilos del Drawer y subcomponentes
const styles = StyleSheet.create({
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userName: { fontSize: 16, fontWeight: '600', color: Palette.text },
  userEmail: { fontSize: 12, color: Palette.textMuted, marginTop: 2 },
  drawerContainer: {
    backgroundColor: Palette.surface,
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  logoutBtn: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderColor: Palette.border,
    marginTop: Spacing.md,
    backgroundColor: Palette.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
  },
  logoutText: { color: '#c00', fontWeight: '600' },
});
