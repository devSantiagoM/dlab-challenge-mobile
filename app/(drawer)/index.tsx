// Pantalla de Dashboard
// - Muestra indicadores rápidos (Empleados, Recibos, Mensajes)
// - Tarjetas de navegación a secciones principales
// - Carga de stats mínima desde servicios, con diseño responsivo
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { fetchEmployees } from '@/services/employees';
import { fetchReceipts } from '@/services/receipts';

export default function DashboardScreen() {
  // Medidas para responsividad y navegación
  const { width } = useWindowDimensions();
  const router = useRouter();

  const isTwoCol = width >= 360;
  const isThreeCol = width >= 768;
  const titleSize = width >= 1024 ? 26 : width >= 768 ? 24 : width >= 430 ? 22 : width >= 360 ? 20 : 18;

  // Estados de indicadores y carga
  const [employeesCount, setEmployeesCount] = React.useState<number | null>(null);
  const [receiptsCount, setReceiptsCount] = React.useState<number | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(false);

  // Efecto: carga stats iniciales (conteos) desde servicios
  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoadingStats(true);
        const [emps, recs] = await Promise.all([
          fetchEmployees().catch(() => []),
          fetchReceipts({ page: 1 }).catch(() => ({ items: [], totalCount: undefined } as any)),
        ]);
        if (!alive) return;
        setEmployeesCount(Array.isArray(emps) ? emps.length : null);
        // Prefer totalCount from API; fallback to items length
        const total = (recs as any)?.totalCount ?? (Array.isArray((recs as any)?.items) ? (recs as any).items.length : null);
        setReceiptsCount(typeof total === 'number' ? total : null);
      } finally {
        if (alive) setLoadingStats(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  // Subcomponente: tarjeta de navegación
  const Card = ({
    icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardIconWrap}>
        <Ionicons name={icon} size={20} color={Palette.primary} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  // UI: encabezado, stats y grid de accesos rápidos
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: Spacing.md }}>
      <View style={styles.headerCard}>
        <Text style={[styles.title, { fontSize: titleSize }]}>Bienvenido</Text>
        <Text style={styles.subtitle}>Resumen general y accesos rápidos</Text>
      </View>

      {/* Quick stats (placeholders) */}
      <View style={[styles.grid, { marginTop: Spacing.md }] }>
        <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Empleados</Text>
            <Text style={styles.statValue}>{employeesCount ?? (loadingStats ? '…' : '—')}</Text>
          </View>
        </View>
        <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Recibos</Text>
            <Text style={styles.statValue}>{receiptsCount ?? (loadingStats ? '…' : '—')}</Text>
          </View>
        </View>
        <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Mensajes</Text>
            <Text style={styles.statValue}>—</Text>
          </View>
        </View>
      </View>

      {/* Navigation cards */}
      <View style={[styles.grid, { marginTop: Spacing.lg }]}>
        <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
          <Card icon="people-outline" title="Empleados" subtitle="Gestiona la información del equipo" onPress={() => router.push('/(drawer)/employees')} />
        </View>
        <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
          <Card icon="document-text-outline" title="Recibos" subtitle="Visualiza y descarga recibos" onPress={() => router.push('/(drawer)/receipts')} />
        </View>
        <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
          <Card icon="chatbubbles-outline" title="Comunicación" subtitle="Mensajería interna" onPress={() => router.push('/(drawer)/communication')} />
        </View>
        <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
          <Card icon="settings-outline" title="Configuración" subtitle="Preferencias de la app" onPress={() => router.push('/(drawer)/settings')} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  headerCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  title: { fontWeight: '700', color: Palette.text },
  subtitle: { color: Palette.textMuted, marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { marginBottom: Spacing.lg },
  gridItemHalf: { width: '48%' },
  gridItemThird: { width: '31%' },
  gridItemFull: { width: '100%' },

  statCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  statLabel: { color: Palette.textMuted },
  statValue: { color: Palette.text, fontSize: 22, fontWeight: '700', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    backgroundColor: '#F8FAFC',
  },
  cardTitle: { color: Palette.text, fontWeight: '700', marginBottom: 2 },
  cardSubtitle: { color: Palette.textMuted },
});
