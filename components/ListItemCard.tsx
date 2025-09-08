import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = { title: string; subtitle?: string; right?: string; onPress?: () => void };
export default function ListItemCard({ title, subtitle, right, onPress }: Props) {
  const content = (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {!!right && <Text style={styles.right}>{right}</Text>}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  return content;
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 12, borderRadius: 8, elevation: 1, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#666' },
  right: { marginLeft: 12, color: '#224', fontWeight: '700' },
});
