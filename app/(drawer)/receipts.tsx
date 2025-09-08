// Pantalla de Recibos
// - Lista y filtrado de recibos con paginación desde API
// - Acciones: abrir/descargar/compartir PDF (link directo o fallback binario)
// - Filtros básicos y avanzados (en modal) + búsqueda por texto
import DropdownSelect, { type Option } from '@/components/DropdownSelect';
import SearchBar from '@/components/SearchBar';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { fetchReceiptBinary, fetchReceiptFileUrl, fetchReceipts, type Receipt } from '@/services/receipts';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export default function ReceiptsScreen() {
  // Estado de búsqueda, filtros básicos (server-side) y avanzados
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<{ month?: string; year?: string; status?: string; order?: 'recent' | 'oldest'; sector?: string }>({ order: 'recent', sector: 'all' });
  const [advOpen, setAdvOpen] = useState(false);
  const [adv, setAdv] = useState<{ sent?: 'si' | 'no' | 'all'; read?: 'si' | 'no' | 'all' }>({ sent: 'all', read: 'all' });
  const [apiItems, setApiItems] = useState<Receipt[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState<number | undefined>(undefined);
  const { width, height } = useWindowDimensions();
  const isTwoCol = width >= 360; // iPhone 12/13 ~390px -> true
  const isThreeCol = width >= 768; // Tablets
  const isCompactHeader = width < 400; // stack title/actions on narrow phones (iPhone 12/13, S8)

  // Estado para previsualización web (modal centrado con PDF)
  const [webPreviewOpen, setWebPreviewOpen] = useState(false);
  const [webPdfUrl, setWebPdfUrl] = useState<string | null>(null);
  const [webLoading, setWebLoading] = useState(false);
  const [webItem, setWebItem] = useState<Receipt | null>(null);
  const [webError, setWebError] = useState<string | null>(null);
  const [webDirectUrl, setWebDirectUrl] = useState<string | null>(null);

  const orderOptions: Option[] = [
    { label: 'Más Recientes', value: 'recent' },
    { label: 'Más Antiguos', value: 'oldest' },
  ];
  // 'Tipo' se alinea con 'Sector' para evitar redundancia (desde datos actuales cargados)
  const sectorValues = Array.from(new Set(apiItems.map((r) => r.sector)));
  const typeOptions: Option[] = [{ label: 'Todos', value: 'all' }, ...sectorValues.map((s) => ({ label: s, value: s }))];
  const monthOptions: Option[] = Array.from({ length: 12 }, (_, i) => {
    const v = String(i + 1).padStart(2, '0');
    return { label: v, value: v };
  });
  const currentYear = new Date().getFullYear();
  const yearOptions: Option[] = [currentYear - 2, currentYear - 1, currentYear].map((y) => ({ label: String(y), value: String(y) }));
  const statusOptions: Option[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Pagado', value: 'Pagado' },
    { label: 'Pendiente', value: 'Pendiente' },
  ];
  const yesNoAll: Option[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Sí', value: 'si' },
    { label: 'No', value: 'no' },
  ];

  // Derivación local: búsqueda por texto y ordenamiento (API ya filtra lo principal)
  const filtered = useMemo((): Receipt[] => {
    // Con API, ya aplicamos la mayoría de filtros en servidor; aquí mantenemos búsqueda por texto y orden
    const base = apiItems.filter((r: Receipt) => r.name.toLowerCase().includes(query.toLowerCase()));
    const arr = [...base];
    arr.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return filters.order === 'oldest' ? da - db : db - da;
    });
    return arr;
  }, [apiItems, query, filters.order]);

  // Efecto: Fetch desde API según filtros server-side y página
  React.useEffect(() => {
    const doFetch = async () => {
      try {
        setLoadingList(true);
        const params: Record<string, string> = {};
        if (filters.year) params.year = String(filters.year);
        if (filters.month) params.month = String(filters.month);
        if (filters.sector && filters.sector !== 'all') params.type = String(filters.sector);
        if (adv.sent && adv.sent !== 'all') params.isSended = adv.sent === 'si' ? 'true' : 'false';
        if (adv.read && adv.read !== 'all') params.isReaded = adv.read === 'si' ? 'true' : 'false';
        if (filters.status && filters.status !== 'all') params.isSigned = filters.status === 'Pagado' ? 'true' : 'false';
        params.page = String(page);
        const res = await fetchReceipts(params);
        setApiItems(res.items);
        if (res.numPages) setPageCount(res.numPages);
      } catch (e) {
        console.warn('Error fetching receipts', e);
      } finally {
        setLoadingList(false);
      }
    };
    doFetch();
  }, [filters.year, filters.month, filters.sector, filters.status, adv.sent, adv.read, page]);

  // Acción: abrir/compartir un recibo
  // 1) Intenta URL directa de API; 2) Fallback binario (descarga base64 y comparte/abre)
  const openReceipt = async (item: Receipt) => {
    try {
      // 1) Obtener URL del PDF desde la API
      try {
        const url = await fetchReceiptFileUrl(item.id);
        if (Platform.OS === 'web') {
          // En web: mostrar modal centrado con "Cargando archivo…" y luego el PDF
          setWebPreviewOpen(true);
          setWebItem(item);
          setWebError(null);
          setWebDirectUrl(url);
          setWebLoading(true);
          try {
            // Intentamos descargar el PDF para crear un blob y evitar restricciones de incrustación
            const resp = await fetch(url);
            const blob = await resp.blob();
            const objUrl = URL.createObjectURL(blob);
            setWebPdfUrl(objUrl);
          } catch {
            // Si falla la descarga blob, mostramos mensaje y opción de abrir en otra pestaña
            setWebPdfUrl(null);
            setWebError('No se pudo cargar la vista previa. Puedes abrir el archivo en otra pestaña.');
          } finally {
            setWebLoading(false);
          }
          return;
        }
        // En mobile: descargar a disco y abrir/compartir
        const dir = FileSystem.documentDirectory + 'receipts/';
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const fileUri = dir + `${item.name.replace(/\s+/g, '_')}_${item.month}-${item.year}.pdf`;
        const dl = await FileSystem.downloadAsync(url, fileUri);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(dl.uri);
        } else if (Platform.OS === 'android') {
          const contentUri = await FileSystem.getContentUriAsync(dl.uri);
          await Linking.openURL(contentUri);
        } else {
          await Linking.openURL(dl.uri);
        }
        return;
      } catch {
        // Si falla la URL de API, seguimos al fallback binario
      }

      // 2) Fallback: descarga binaria mock y abrir/compartir
      const blob = await fetchReceiptBinary(item.id);
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = typeof reader.result === 'string' ? reader.result : '';
          const b64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const dir = FileSystem.documentDirectory + 'receipts/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const fileUri = dir + `${item.name.replace(/\s+/g, '_')}_${item.month}-${item.year}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await Linking.openURL(contentUri);
      } else {
        await Linking.openURL(fileUri);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo abrir el recibo');
    }
  };

  const total = filtered.length;

  // Acción: reiniciar a primera página para refetch
  const onRefresh = () => {
    // Reinicia a primera página y dispara useEffect
    setPage(1);
  };

  // UI: header con acciones, filtros, modal avanzado y listado con paginación
  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: Spacing.md }}>
        {/* Header actions */}
        <View style={[styles.headerCard, isCompactHeader && styles.headerCardCompact]}>
          <View style={[{ flex: 1 }, isCompactHeader && { marginBottom: Spacing.md }]}>
            <Text style={styles.title}>Lista de Recibos</Text>
            <Text style={styles.subtitle}>{total} recibo{total === 1 ? '' : 's'} en total</Text>
          </View>
          <View style={[styles.actionsRow, isCompactHeader && styles.actionsRowCompact]}>
            <TouchableOpacity style={[styles.ghostBtn, isCompactHeader && styles.actionBtnCompact]} onPress={onRefresh} disabled={loadingList}>
              <Ionicons name="refresh" size={16} color={Palette.text} />
              <Text style={styles.ghostBtnText}>{loadingList ? 'Actualizando…' : 'Refrescar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, isCompactHeader && styles.actionBtnCompact]} onPress={() => { }}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Nuevo Recibo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros de Búsqueda */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filtros de Búsqueda</Text>
          <View style={{ marginTop: Spacing.md }}>
            <SearchBar value={query} onChange={setQuery} placeholder="Buscar recibos" />
          </View>
          {/* Grid de filtros (2 columnas envolventes también en móviles) */}
          <View style={[styles.grid, { marginTop: Spacing.md }]}>
            <View style={[
              styles.gridItem,
              isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull,
            ]}>
              <DropdownSelect
                label="Ordenar por"
                value={filters.order}
                options={orderOptions}
                onChange={(v) => setFilters((f) => ({ ...f, order: v as 'recent' | 'oldest' }))}
              />
            </View>
            <View style={[
              styles.gridItem,
              isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull,
            ]}>
              <DropdownSelect
                label="Tipo"
                value={filters.sector}
                options={typeOptions}
                onChange={(v) => setFilters((f) => ({ ...f, sector: v }))}
              />
            </View>
            <View style={[
              styles.gridItem,
              isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull,
            ]}>
              <DropdownSelect
                label="Mes"
                value={filters.month}
                options={[{ label: 'Todos', value: 'all' }, ...monthOptions]}
                onChange={(v) => setFilters((f) => ({ ...f, month: v === 'all' ? undefined : v }))}
              />
            </View>
            <View style={[
              styles.gridItem,
              isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull,
            ]}>
              <DropdownSelect
                label="Año"
                value={filters.year}
                options={[{ label: 'Todos', value: 'all' }, ...yearOptions]}
                onChange={(v) => setFilters((f) => ({ ...f, year: v === 'all' ? undefined : v }))}
              />
            </View>
            <View style={[
              styles.gridItem,
              isThreeCol ? styles.gridItemThird : isTwoCol ? styles.gridItemHalf : styles.gridItemFull,
            ]}>
              <DropdownSelect
                label="Estado"
                value={filters.status ?? 'all'}
                options={statusOptions}
                onChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : (v as 'Pagado' | 'Pendiente') }))}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.ghostBtn, { marginTop: Spacing.md, alignSelf: 'flex-start' }]} onPress={() => setAdvOpen(true)}>
            <Ionicons name="filter" size={16} color={Palette.text} />
            <Text style={styles.ghostBtnText}>Agregar Filtro</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Filtros Avanzados (sin 'Sector' para no duplicar 'Tipo') */}
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
                <DropdownSelect
                  label="Enviado"
                  value={adv.sent ?? 'all'}
                  options={yesNoAll}
                  onChange={(v) => setAdv((p) => ({ ...p, sent: v as 'si' | 'no' | 'all' }))}
                />
                <View style={{ height: Spacing.md }} />
                <DropdownSelect
                  label="Leído"
                  value={adv.read ?? 'all'}
                  options={yesNoAll}
                  onChange={(v) => setAdv((p) => ({ ...p, read: v as 'si' | 'no' | 'all' }))}
                />
                <View style={{ height: Spacing.lg }} />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm }}>
                  <TouchableOpacity
                    style={styles.ghostBtn}
                    onPress={() => setAdv({ sent: 'all', read: 'all' })}
                  >
                    <Text style={styles.ghostBtnText}>Limpiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => setAdvOpen(false)}
                  >
                    <Text style={styles.primaryBtnText}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Lista de Recibos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recibos</Text>
          <View style={{ marginTop: Spacing.md }}>
            {loadingList && (
              <View style={{ paddingVertical: Spacing.lg, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Palette.primary} />
                <Text style={{ marginTop: 8, color: Palette.textMuted }}>Cargando…</Text>
              </View>
            )}
            {!loadingList && total === 0 && (
              <View style={[styles.receiptItem, { alignItems: 'center' }]}>
                <Text style={styles.subtitle}>No hay resultados</Text>
              </View>
            )}
            {!loadingList && total > 0 && filtered.map((item) => (
              <TouchableOpacity key={item.id} style={styles.receiptItem} onPress={() => openReceipt(item)}>
                <View style={styles.receiptHeaderRow}>
                  <View style={styles.badge}><Text style={styles.badgeText}>{item.sector}</Text></View>
                  <View style={{ flex: 1 }} />
                  {item.sent ? (
                    <Ionicons name="checkmark-circle" size={14} color="#38BDF8" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="close-circle" size={14} color="#EF4444" style={{ marginRight: 8 }} />
                  )}
                  {item.read ? (
                    <Ionicons name="checkmark-circle" size={14} color="#34D399" />
                  ) : (
                    <Ionicons name="close-circle" size={14} color="#EF4444" />
                  )}
                </View>
                <Text style={styles.receiptTitle}>{item.name}</Text>
                <Text style={styles.receiptSub}>{item.month}/{item.year}</Text>
                <View style={{ height: 8 }} />
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Enviado:</Text>
                  <Text style={[styles.metaValue, { color: item.sent ? '#111827' : '#EF4444' }]}>
                    {item.sent ? 'Sí' : 'No'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Leído:</Text>
                  <Text style={[styles.metaValue, { color: item.read ? '#111827' : '#EF4444' }]}>
                    {item.read ? 'Sí' : 'No'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Firmado:</Text>
                  <Text style={[styles.metaValue, { color: item.status === 'Pagado' ? '#111827' : '#EF4444' }]}>
                    {item.status === 'Pagado' ? 'Sí' : 'No'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {pageCount && pageCount > 1 && (
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
                  style={[styles.ghostBtn, { opacity: pageCount ? (page === pageCount ? 0.6 : 1) : 1 }]}
                  onPress={() => setPage((p) => (pageCount ? Math.min(pageCount, p + 1) : p + 1))}
                  disabled={!!pageCount && page === pageCount}
                >
                  <Text style={styles.ghostBtnText}>Siguiente</Text>
                  <Ionicons name="chevron-forward" size={16} color={Palette.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      {/* Modal de previsualización Web: centrado, con cargando y acciones */}
      {Platform.OS === 'web' && (
        <Modal visible={webPreviewOpen} transparent animationType="fade" onRequestClose={() => setWebPreviewOpen(false)}>
          <View style={styles.backdrop}>
            {(() => {
              const modalW = Math.min(width * 0.95, 1024);
              const modalH = Math.min(height * 0.9, 920);
              return (
                <View style={[styles.webPreviewCard, { width: modalW, height: modalH }]}>
                  <View style={[styles.modalHeader, { flexWrap: 'wrap', rowGap: 8 }]}>
                    <Text style={styles.modalTitle}>Recibo</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1, flexWrap: 'wrap' }}>
                      {!!webPdfUrl && (
                        <>
                          <TouchableOpacity
                            style={styles.ghostBtn}
                            onPress={() => {
                              try {
                                const a = document.createElement('a');
                                a.href = webPdfUrl!;
                                const fallback = 'recibo.pdf';
                                const custom = webItem ? `${webItem.name.replace(/\s+/g, '_')}_${webItem.month}-${webItem.year}.pdf` : fallback;
                                a.download = custom;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              } catch { }
                            }}
                          >
                            <Ionicons name="download" size={16} color={Palette.text} />
                            <Text style={styles.ghostBtnText}>Descargar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.ghostBtn}
                            onPress={async () => {
                              try {
                                // @ts-ignore
                                if (navigator?.share) {
                                  // @ts-ignore
                                  const title = webItem ? `${webItem.name} ${webItem.month}/${webItem.year}` : 'Recibo';
                                  await navigator.share({ title, url: webPdfUrl! });
                                } else {
                                  const a = document.createElement('a');
                                  a.href = webPdfUrl!;
                                  a.target = '_blank';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }
                              } catch { }
                            }}
                          >
                            <Ionicons name="share-social-outline" size={16} color={Palette.text} />
                            <Text style={styles.ghostBtnText}>Compartir</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity style={styles.ghostBtn} onPress={() => { setWebPreviewOpen(false); setWebPdfUrl(null); setWebItem(null); }}>
                        <Ionicons name="close" size={16} color={Palette.text} />
                        <Text style={styles.ghostBtnText}>Cerrar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: Spacing.lg }}>
                    {webLoading && (
                      <View style={{ alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={Palette.primary} />
                        <Text style={{ marginTop: 8, color: Palette.textMuted }}>Cargando archivo…</Text>
                      </View>
                    )}
                    {!webLoading && !!webError && (
                      <View style={{ alignItems: 'center', gap: Spacing.md }}>
                        <Text style={{ color: Palette.text, textAlign: 'center' }}>{webError}</Text>
                        {webDirectUrl && (
                          <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => {
                              try {
                                const a = document.createElement('a');
                                a.href = webDirectUrl;
                                a.target = '_blank';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              } catch { }
                            }}
                          >
                            <Ionicons name="open-outline" size={16} color="#fff" />
                            <Text style={styles.primaryBtnText}>Abrir en otra pestaña</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {!webLoading && !!webPdfUrl && (
                      (() => {
                        const IFrame: any = 'iframe';
                        return (
                          <IFrame
                            src={webPdfUrl}
                            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
                          />
                        );
                      })()
                    )}
                  </View>
                </View>
              );
            })()}
          </View>
        </Modal>
      )}
    </>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  headerCardCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  title: { fontSize: 20, fontWeight: '700', color: Palette.text },
  subtitle: { color: Palette.textMuted, marginTop: 2 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionsRowCompact: { flexWrap: 'wrap' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionBtnCompact: {
    flexGrow: 1,
    minWidth: '48%',
  },
  ghostBtnText: { color: Palette.text, fontWeight: '600' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },
  twoCols: { flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { marginBottom: Spacing.lg },
  gridItemHalf: { width: '48%' },
  gridItemThird: { width: '31%' },
  gridItemFull: { width: '100%' },
  label: { color: Palette.textMuted, marginBottom: 6 },
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
  selectText: { color: Palette.text },
  receiptItem: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    backgroundColor: '#fff',
    marginBottom: Spacing.md,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  receiptHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  badgeText: { fontSize: 12, color: Palette.textMuted },
  receiptTitle: { marginTop: 8, fontSize: 16, fontWeight: '700', color: Palette.text },
  receiptSub: { color: Palette.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaLabel: { width: 80, color: Palette.textMuted },
  metaValue: { color: Palette.text },
  // Advanced filter modal styles
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: Spacing.lg },
  modalCard: { backgroundColor: '#fff', borderRadius: Radius.lg, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderColor: Palette.border },
  modalTitle: { fontWeight: '700', color: Palette.text },
  // Pager
  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md },
  pagerText: { color: Palette.textMuted },
  // Web preview modal
  webPreviewCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    width: '90%',
    maxWidth: 960,
    height: '85%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
});
