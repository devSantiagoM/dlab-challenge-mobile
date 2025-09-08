// Pantalla de Configuración
// - Usa el mismo patrón visual que el resto de la app (tarjetas, títulos, sombras sutiles)
// - Agrupa opciones por secciones: Apariencia, Idioma, Notificaciones y Soporte
// - Este archivo solo define UI; no persiste preferencias globales (podemos conectarlo más tarde)
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  // Estados locales para toggles de ejemplo. 
  // Nota: hoy no persisten, pero se pueden conectar a AsyncStorage/APIs si lo deseas.
  const [dark, setDark] = useState(false);
  const [es, setEs] = useState(true);
  const [push, setPush] = useState(true);
  const [emailNtf, setEmailNtf] = useState(false);

  return (
    // Scroll principal con padding vertical uniforme
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: Spacing.md }}>
      {/* Encabezado de la pantalla, con icono representativo */}
      <View style={styles.headerCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Personaliza la apariencia y las preferencias de tu cuenta</Text>
        </View>
        <View style={styles.headerIconWrap}>
          <Ionicons name="settings-outline" size={20} color={Palette.text} />
        </View>
      </View>

      {/* Sección: Apariencia (modo oscuro, explicación breve) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Apariencia</Text>
        <Text style={styles.helper}>El modo oscuro invierte colores de fondo y tarjetas.</Text>
        <View style={styles.row}> 
          <Text style={styles.label}>Tema oscuro</Text>
          <Switch value={dark} onValueChange={setDark} />
        </View>
      </View>

      {/* Sección: Idioma (placeholder de i18n / multilenguaje) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Idioma</Text>
        <View style={styles.row}> 
          <Text style={styles.label}>Español</Text>
          <Switch value={es} onValueChange={setEs} />
        </View>
        <Text style={styles.helper}>Pronto: más idiomas disponibles.</Text>
      </View>

      {/* Sección: Notificaciones (toggles para Push y Email) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notificaciones</Text>
        <View style={styles.row}> 
          <Text style={styles.label}>Notificaciones Push</Text>
          <Switch value={push} onValueChange={setPush} />
        </View>
        <View style={styles.row}> 
          <Text style={styles.label}>Notificaciones por Email</Text>
          <Switch value={emailNtf} onValueChange={setEmailNtf} />
        </View>
      </View>

      {/* Sección: Soporte (acciones navegables o links) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Soporte</Text>
        <TouchableOpacity style={styles.ghostBtn}>
          <Ionicons name="help-circle-outline" size={16} color={Palette.text} />
          <Text style={styles.ghostBtnText}>Centro de ayuda</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.sm }} />
        <TouchableOpacity style={styles.ghostBtn}>
          <Ionicons name="chatbubbles-outline" size={16} color={Palette.text} />
          <Text style={styles.ghostBtnText}>Contactar soporte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Estilos de la pantalla de Configuración
// Conservan el diseño de tarjetas y tipografías usados en otras vistas
const styles = StyleSheet.create({
  // Contenedor con padding horizontal consistente
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  // Tarjeta de encabezado: fondo surface, borde suave y sombra sutil
  headerCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  // Contenedor del icono del header
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: Palette.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff'
  },
  // Tipografías del encabezado
  title: { fontSize: 20, fontWeight: '700', color: Palette.text },
  subtitle: { color: Palette.textMuted, marginTop: 2 },

  // Tarjetas seccionales
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },
  // Texto auxiliar para explicar la sección
  helper: { color: Palette.textMuted, marginBottom: Spacing.md, marginTop: 2 },
  // Fila estándar: label a la izquierda, control a la derecha
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  label: { fontSize: 16, color: Palette.text },

  // Botón fantasma reutilizado en Soporte
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    alignSelf: 'flex-start',
  },
  ghostBtnText: { color: Palette.text, fontWeight: '600' },
});
