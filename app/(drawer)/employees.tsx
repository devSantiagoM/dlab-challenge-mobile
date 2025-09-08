// Pantalla de Empleados
// - Lista de empleados con filtros básicos y avanzados
// - Búsqueda por texto, ordenamiento y paginación local
// - Carga de datos desde servicio `fetchEmployees`
import DropdownSelect, { type Option } from '@/components/DropdownSelect';
import SearchBar from '@/components/SearchBar';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { Employee, fetchEmployees } from '@/services/employees';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export default function EmployeesScreen() {
  // Estado de búsqueda, filtros simples (arriba) y filtros avanzados (modal)
  const [query, setQuery] = useState('');
  // Búsqueda con debounce para evitar filtrar en cada pulsación
  const [queryDebounced, setQueryDebounced] = useState('');
  const [filters, setFilters] = useState<{
    id?: string;
    order?: 'recent' | 'oldest';
    firstName?: string;
    lastName?: string;
    email?: string;
  }>({ order: 'recent' });
  const [advOpen, setAdvOpen] = useState(false);
  const [adv, setAdv] = useState<{
    tipoRemuneracion?: string;
    cargo?: string;
    area?: string;
    turno?: string;
    activo?: 'all' | 'si' | 'no';
    nacionalidad?: string;
    role?: string;
  }>({ activo: 'all' });

  // Datos provenientes de API y estado de carga
  const [apiData, setApiData] = useState<Employee[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const { width } = useWindowDimensions();
  const isTwoCol = width >= 360;
  const isThreeCol = width >= 768;
  const isCompactHeader = width < 400;
  const isNarrowRow = width < 460;
  // Responsive title sizing (e.g., iPhone 14 Pro Max ~430 width)
  const titleSize = width >= 1024 ? 24 : width >= 768 ? 22 : width >= 430 ? 22 : width >= 360 ? 20 : 18;

  const orderOptions: Option[] = [
    { label: 'Más Recientes', value: 'recent' },
    { label: 'Más Antiguos', value: 'oldest' },
  ];

  // Build options from dataset
  const unique = <K extends keyof Employee>(key: K) => Array.from(new Set(apiData.map((e) => `${e[key]}`))).filter(Boolean);
  const areaOptions: Option[] = [{ label: 'Todos', value: 'all' }, ...unique('area').map((v) => ({ label: v, value: v }))];
  const cargoOptions: Option[] = [{ label: 'Todos', value: 'all' }, ...unique('cargo').map((v) => ({ label: v, value: v }))];
  const roleOptions: Option[] = [{ label: 'Todos', value: 'all' }, ...unique('role').map((v) => ({ label: v, value: v }))];
  const turnoOptions: Option[] = [{ label: 'Todos', value: 'all' }, ...unique('turno').map((v) => ({ label: v, value: v }))];
  const tipoRemOptions: Option[] = [{ label: 'Todos', value: 'all' }, ...unique('tipoRemuneracion').map((v) => ({ label: v, value: v }))];
  const nacionalidadOptions: Option[] = [{ label: 'Todos', value: 'all' }, ...unique('nacionalidad').map((v) => ({ label: v, value: v }))];
  const activoOptions: Option[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Sí', value: 'si' },
    { label: 'No', value: 'no' },
  ];

  // Derivación: aplica filtros locales y orden a la lista
  const filtered = useMemo(() => {
    const base = apiData.filter((e: Employee) => {
      const inQuery = `${e.firstName} ${e.lastName} ${e.email}`
        .toLowerCase()
        .includes(queryDebounced.trim().toLowerCase());

      const matchId = filters.id ? String(e.id).includes(filters.id.trim()) : true;
      const matchFirst = filters.firstName
        ? e.firstName.toLowerCase().includes(filters.firstName.toLowerCase())
        : true;
      const matchLast = filters.lastName
        ? e.lastName.toLowerCase().includes(filters.lastName.toLowerCase())
        : true;
      const matchEmail = filters.email
        ? e.email.toLowerCase().includes(filters.email.toLowerCase())
        : true;

      const matchArea = adv.area && adv.area !== 'all' ? e.area === adv.area : true;
      const matchCargo = adv.cargo && adv.cargo !== 'all' ? e.cargo === adv.cargo : true;
      const matchRol = adv.role && adv.role !== 'all' ? e.role === adv.role : true;
      const matchTurno = adv.turno && adv.turno !== 'all' ? e.turno === adv.turno : true;
      const matchTipo = adv.tipoRemuneracion && adv.tipoRemuneracion !== 'all' ? e.tipoRemuneracion === adv.tipoRemuneracion : true;
      const matchNac = adv.nacionalidad && adv.nacionalidad !== 'all' ? e.nacionalidad === adv.nacionalidad : true;
      const matchActivo = adv.activo && adv.activo !== 'all' ? (adv.activo === 'si' ? e.status === 'Activo' : e.status === 'Inactivo') : true;

      return (
        inQuery &&
        matchId &&
        matchFirst &&
        matchLast &&
        matchEmail &&
        matchArea &&
        matchCargo &&
        matchRol &&
        matchTurno &&
        matchTipo &&
        matchNac &&
        matchActivo
      );
    });

    const arr = [...base];
    arr.sort((a, b) => (filters.order === 'oldest' ? a.id - b.id : b.id - a.id));
    return arr;
  }, [apiData, queryDebounced, filters, adv]);

  const total = filtered.length;
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Paginación local
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paged = filtered.slice(start, end);

  // Efecto: trae empleados cuando cambian filtros clave (lado servidor)
  React.useEffect(() => {
    // aplica debounce a la búsqueda
    const t = setTimeout(() => setQueryDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    const doFetch = async () => {
      try {
        setLoadingList(true);
        const params: Record<string, string> = {};
        if (adv.nacionalidad) params.nationality = adv.nacionalidad;
        if (filters.id) params.employeeNumber = String(filters.id).trim();
        if (filters.firstName) params.firstName = filters.firstName.trim();
        if (filters.lastName) params.lastName = filters.lastName.trim();
        if (filters.email) params.email = filters.email.trim();
        const list = await fetchEmployees(params);
        setApiData(list);
      } catch (e) {
        console.warn('Error fetching employees', e);
      } finally {
        setLoadingList(false);
      }
    };
    doFetch();
  }, [adv.nacionalidad, filters.id, filters.firstName, filters.lastName, filters.email]);

  // Acción: refresca lista manualmente respetando filtros
  const onRefresh = async () => {
    try {
      setLoadingList(true);
      const params: Record<string, string> = {};
      if (adv.nacionalidad) params.nationality = adv.nacionalidad;
      if (filters.id) params.employeeNumber = String(filters.id).trim();
      if (filters.firstName) params.firstName = filters.firstName.trim();
      if (filters.lastName) params.lastName = filters.lastName.trim();
      if (filters.email) params.email = filters.email.trim();
      const list = await fetchEmployees(params);
      setApiData(list);
    } catch (e) {
      console.warn('Error fetching employees', e);
    } finally {
      setLoadingList(false);
    }
  };

  // UI: cabecera con acciones, tarjeta de filtros, modal avanzado y tabla de resultados
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: Spacing.md }}>
      {/* Header actions */}
      <View style={[styles.headerCard, isCompactHeader && styles.headerCardCompact]}>
        <View style={[{ flex: 1 }, isCompactHeader && { marginBottom: Spacing.md }]}>
          <Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={1} adjustsFontSizeToFit>
            Lista de Empleados
          </Text>
          <Text style={styles.subtitle}>{total} empleado{total === 1 ? '' : 's'} en total</Text>
        </View>
        <View style={[styles.actionsRow, isCompactHeader && styles.actionsRowCompact]}>
          <TouchableOpacity style={[styles.ghostBtn, isCompactHeader && styles.actionBtnCompact]} onPress={onRefresh} disabled={loadingList}>
            <Ionicons name="download" size={16} color={Palette.text} />
            <Text style={styles.ghostBtnText}>{loadingList ? 'Actualizando...' : 'Importar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, isCompactHeader && styles.actionBtnCompact]}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Nuevo Empleado</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros de Búsqueda (texto + selects) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Filtros de Búsqueda</Text>
        <View style={{ marginTop: Spacing.md }}>
          <SearchBar value={query} onChange={setQuery} placeholder="Buscar empleados" />
        </View>
        <View style={[styles.grid, { marginTop: Spacing.md }]}>
          <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
            <Text style={styles.label}>Número</Text>
            <TextInput
              value={filters.id ?? ''}
              onChangeText={(t) => setFilters((f) => ({ ...f, id: t }))}
              style={styles.input}
              keyboardType="numeric"
              placeholder="Ej: 123"
              placeholderTextColor={Palette.textMuted}
            />
          </View>
          <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
            <DropdownSelect
              label="Ordenar por"
              value={filters.order}
              options={orderOptions}
              onChange={(v) => setFilters((f) => ({ ...f, order: v as 'recent' | 'oldest' }))}
            />
          </View>
          <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
            <DropdownSelect
              label="Estado"
              value={adv.activo ?? 'all'}
              options={activoOptions}
              onChange={(v) => setAdv((p) => ({ ...p, activo: v as 'all' | 'si' | 'no' }))}
            />
          </View>
          <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
            <DropdownSelect
              label="Sector"
              value={adv.area ?? 'all'}
              options={areaOptions}
              onChange={(v) => setAdv((p) => ({ ...p, area: v === 'all' ? undefined : v }))}
            />
          </View>
          <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={filters.firstName ?? ''}
              onChangeText={(t) => setFilters((f) => ({ ...f, firstName: t }))}
              style={styles.input}
              placeholder="Ej: Ana"
              placeholderTextColor={Palette.textMuted}
            />
          </View>
          <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              value={filters.lastName ?? ''}
              onChangeText={(t) => setFilters((f) => ({ ...f, lastName: t }))}
              style={styles.input}
              placeholder="Ej: Gómez"
              placeholderTextColor={Palette.textMuted}
            />
          </View>
          <View style={[styles.gridItem, isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull]}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              value={filters.email ?? ''}
              onChangeText={(t) => setFilters((f) => ({ ...f, email: t }))}
              style={styles.input}
              placeholder="Ej: demo@empresa.com"
              placeholderTextColor={Palette.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
        <TouchableOpacity style={[styles.ghostBtn, { alignSelf: 'flex-start' }]} onPress={() => setAdvOpen(true)}>
          <Ionicons name="filter" size={16} color={Palette.text} />
          <Text style={styles.ghostBtnText}>Más Filtros</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Filtros Avanzados */}
      <Modal visible={advOpen} transparent animationType="fade" onRequestClose={() => setAdvOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros avanzados</Text>
              <TouchableOpacity onPress={() => setAdvOpen(false)}>
                <Ionicons name="close" size={20} color={Palette.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: Spacing.lg }}>
              <DropdownSelect label="Tipo de remuneración" value={adv.tipoRemuneracion ?? 'all'} options={tipoRemOptions}
                onChange={(v) => setAdv((p) => ({ ...p, tipoRemuneracion: v === 'all' ? undefined : v }))}
              />
              <View style={{ height: Spacing.md }} />
              <DropdownSelect label="Cargo" value={adv.cargo ?? 'all'} options={cargoOptions}
                onChange={(v) => setAdv((p) => ({ ...p, cargo: v === 'all' ? undefined : v }))}
              />
              <View style={{ height: Spacing.md }} />
              <DropdownSelect label="Sector" value={adv.area ?? 'all'} options={areaOptions}
                onChange={(v) => setAdv((p) => ({ ...p, area: v === 'all' ? undefined : v }))}
              />
              <View style={{ height: Spacing.md }} />
              <DropdownSelect label="Turno" value={adv.turno ?? 'all'} options={turnoOptions}
                onChange={(v) => setAdv((p) => ({ ...p, turno: v === 'all' ? undefined : v }))}
              />
              <View style={{ height: Spacing.md }} />
              <DropdownSelect label="Activo" value={adv.activo ?? 'all'} options={activoOptions}
                onChange={(v) => setAdv((p) => ({ ...p, activo: v as 'all' | 'si' | 'no' }))}
              />
              <View style={{ height: Spacing.md }} />
              <DropdownSelect label="Nacionalidad" value={adv.nacionalidad ?? 'all'} options={nacionalidadOptions}
                onChange={(v) => setAdv((p) => ({ ...p, nacionalidad: v === 'all' ? undefined : v }))}
              />
              <View style={{ height: Spacing.md }} />
              <DropdownSelect label="Rol" value={adv.role ?? 'all'} options={roleOptions}
                onChange={(v) => setAdv((p) => ({ ...p, role: v === 'all' ? undefined : v }))}
              />
              <View style={{ height: Spacing.lg }} />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm }}>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => setAdv({ activo: 'all' })}>
                  <Text style={styles.ghostBtnText}>Limpiar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setAdvOpen(false)}>
                  <Text style={styles.primaryBtnText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lista de empleados (tabla responsiva) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Empleados</Text>
        <View style={{ marginTop: Spacing.md }}>
          {/* Table header (hidden on very narrow devices by stacking visually) */}
          <View style={[styles.tableHeader, isNarrowRow && styles.tableHeaderCompact]}>
            <Text style={[styles.th, !isNarrowRow && { width: 60 }]}>Número</Text>
            <Text style={[styles.th, styles.thGrow]}>Nombre</Text>
            <Text style={[styles.th, styles.thGrow]}>Correo Electrónico</Text>
            <Text style={[styles.th, !isNarrowRow && { width: 110 }]}>Teléfono/Celular</Text>
            <Text style={[styles.th, !isNarrowRow && { width: 110 }]}>Estado</Text>
            <Text style={[styles.th, !isNarrowRow && { width: 60 }]}>Acciones</Text>
          </View>

          {total === 0 && (
            <View style={[styles.rowItem, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.cellMuted}>No hay resultados</Text>
            </View>
          )}

          {paged.map((e) => (
            <View key={e.id} style={[styles.rowItem, isNarrowRow && styles.rowItemCompact]}>
              <View style={[styles.cellBlock, !isNarrowRow && { width: 60 }]}>
                <Text style={styles.cellMuted}>Número</Text>
                <Text style={styles.cellStrong}>{e.id}</Text>
              </View>
              <View style={[styles.cellBlockGrow, { paddingHorizontal: Spacing.md }]}>
                <Text style={styles.cellStrong}>{e.firstName} {e.lastName}</Text>
                <Text style={styles.cellMuted}>{e.cargo}</Text>
              </View>
              <View style={styles.cellBlockGrow}>
                <Text style={styles.cellMuted}>Correo</Text>
                <Text style={styles.cell}>{e.email}</Text>
              </View>
              <View style={[styles.cellBlock, !isNarrowRow && { width: 110 }]}>
                <Text style={styles.cellMuted}>Teléfono</Text>
                <Text style={styles.cell}>{e.phone ?? 'N/A'}</Text>
              </View>
              <View style={[styles.cellBlock, { alignItems: 'flex-start' }, !isNarrowRow && { width: 110 }]}>
                <Text style={styles.cellMuted}>Estado</Text>
                <View style={[styles.badge, { backgroundColor: e.status === 'Activo' ? '#E6F9F0' : '#FBEAEA', borderColor: e.status === 'Activo' ? '#B6F0D3' : '#F2C1C1' }]}>
                  <Text style={{ color: e.status === 'Activo' ? '#10B981' : '#EF4444' }}>{e.status === 'Activo' ? 'Activo' : 'Inactivo'}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.cellBlock, { paddingHorizontal: Spacing.sm, paddingVertical: 6, alignSelf: isNarrowRow ? 'flex-end' : 'auto' }]}>
                <Ionicons name="create-outline" size={18} color={Palette.text} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Pagination controls */}
          {total > pageSize && (
            <View style={styles.pagerRow}>
              <TouchableOpacity
                style={[styles.ghostBtn, { opacity: page === 1 ? 0.6 : 1 }]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={16} color={Palette.text} />
                <Text style={styles.ghostBtnText}>Anterior</Text>
              </TouchableOpacity>
              <Text style={styles.pagerText}>{page} / {pageCount}</Text>
              <TouchableOpacity
                style={[styles.ghostBtn, { opacity: page === pageCount ? 0.6 : 1 }]}
                onPress={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
              >
                <Text style={styles.ghostBtnText}>Siguiente</Text>
                <Ionicons name="chevron-forward" size={16} color={Palette.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  // Header styles
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
  headerCardCompact: { flexDirection: 'column', alignItems: 'stretch' },
  title: { fontSize: 20, fontWeight: '700', color: Palette.text },
  subtitle: { color: Palette.textMuted, marginTop: 2 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionsRowCompact: { flexWrap: 'wrap' },
  actionBtnCompact: { flexGrow: 1, minWidth: '48%' },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
  },
  ghostBtnText: { color: Palette.text, fontWeight: '600' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Palette.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },

  // Cards / Filters
  card: {
    backgroundColor: Palette.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.border, padding: Spacing.lg, marginTop: Spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 1
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { marginBottom: Spacing.lg },
  gridItemHalf: { width: '48%' },
  gridItemThird: { width: '31%' },
  gridItemFull: { width: '100%' },
  label: { color: Palette.textMuted, marginBottom: 6 },
  input: { height: 44, borderWidth: 1, borderColor: Palette.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff', color: Palette.text },

  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: Spacing.lg },
  modalCard: { backgroundColor: '#fff', borderRadius: Radius.lg, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderColor: Palette.border },
  modalTitle: { fontWeight: '700', color: Palette.text },

  // List rows
  rowItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.lg, backgroundColor: '#fff', marginBottom: Spacing.md },
  rowItemCompact: { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.sm },
  cellBlock: { marginBottom: Spacing.xs },
  cellBlockGrow: { flex: 1, marginBottom: Spacing.xs },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderColor: Palette.border },
  tableHeaderCompact: { display: 'none' },
  th: { color: Palette.textMuted, fontSize: 12 },
  thGrow: { flex: 1 },
  cellMuted: { color: Palette.textMuted, fontSize: 12 },
  cellStrong: { color: Palette.text, fontWeight: '700' },
  cell: { color: Palette.text },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md },
  pagerText: { color: Palette.textMuted },
});
