import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

type FilterOptions = Record<string, string[]>;

type Props = {
  filters: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
  options: FilterOptions;
  allowDynamic?: boolean;
};

export default function FilterChips({ filters, onChange, options, allowDynamic }: Props) {
  const [extra, setExtra] = useState<string[]>(filters.extra ?? []);

  const toggle = (key: string, val: string) => {
    onChange({ ...filters, [key]: filters[key] === val ? undefined : val, extra });
  };

  const addExtra = () => {
    const newExtra = [...extra, `Filtro ${extra.length + 1}`];
    setExtra(newExtra);
    onChange({ ...filters, extra: newExtra });
  };

  return (
    <View style={{ marginBottom: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.entries(options).map(([k, vals]) => (
          <View key={k} style={styles.group}>
            <Text style={styles.groupTitle}>{k}</Text>
            <View style={styles.row}>
              {vals.map((v) => (
                <TouchableOpacity key={v} style={[styles.chip, filters[k] === v && styles.chipActive]} onPress={() => toggle(k, v)}>
                  <Text style={[styles.chipText, filters[k] === v && styles.chipTextActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        {allowDynamic && (
          <TouchableOpacity onPress={addExtra} style={[styles.chip, { backgroundColor: '#eef' }]}>
            <Text style={[styles.chipText, { color: '#224' }]}>+ Agregar más filtros</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  group: { marginRight: 12 },
  groupTitle: { fontSize: 12, color: '#666', marginBottom: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 8 },
  chipActive: { backgroundColor: '#224' },
  chipText: { color: '#333' },
  chipTextActive: { color: 'white' },
});
