import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing } from '@/constants/theme';

export type Option = { label: string; value: string };

type Props = {
  label?: string;
  placeholder?: string;
  value?: string;
  options: Option[];
  onChange: (value: string) => void;
};

export default function DropdownSelect({ label, placeholder, value, options, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const { width } = useWindowDimensions();
  const isSmall = width < 400;

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? 'Seleccionar';

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={[styles.select, isSmall && { height: 40 }]} onPress={() => setOpen(true)}>
        <Text style={styles.selectText} numberOfLines={1}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={Palette.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label ?? 'Seleccionar'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color={Palette.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value ? <Ionicons name="checkmark" size={18} color={Palette.primary} /> : null}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={{ paddingVertical: 4 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: Palette.textMuted, marginBottom: Spacing.xs },
  select: {
    height: 44,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { color: Palette.text, flex: 1, marginRight: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: Spacing.lg },
  modalCard: { backgroundColor: '#fff', borderRadius: Radius.lg, overflow: 'hidden', maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderColor: Palette.border },
  modalTitle: { fontWeight: '700', color: Palette.text },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: 12 },
  optionText: { color: Palette.text },
  separator: { height: 1, backgroundColor: Palette.border, opacity: 0.5 },
});
