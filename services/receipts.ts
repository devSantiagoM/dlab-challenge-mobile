// Servicio de Recibos
// - Define el modelo `Receipt` y el tipo paginado `ReceiptsPage`
// - `fetchReceipts` obtiene páginas de recibos con filtros de servidor
// - `fetchReceiptFileUrl` obtiene el enlace directo a un PDF
// - `fetchReceiptBinary` provee un fallback binario (mock) para descarga
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './_config';

export type Receipt = {
  id: number;
  name: string;
  date: string; // ISO date
  amount: number;
  month: string; // '01'..'12'
  year: number;
  status: 'Pagado' | 'Pendiente';
  sector: string; // Tipo / sector
  sent: boolean; // isSended
  read: boolean; // isReaded
};

export type ReceiptsPage = {
  items: Receipt[];
  numPages?: number;
  totalCount?: number;
  perPage?: number;
  next?: string | null;
  previous?: string | null;
};

// API_BASE centralizado en services/_config

// Mapea un objeto de la API a nuestro modelo `Receipt`
function mapApiReceipt(r: any): Receipt {
  const month = r.month ? String(r.month).padStart(2, '0') : (r.fullDate?.split('/')?.[0] ?? '01');
  const year = r.year ?? Number(r.fullDate?.split('/')?.[1] ?? new Date().getFullYear());
  const status: Receipt['status'] = r.isSigned ? 'Pagado' : 'Pendiente';
  const name = r.type ? `Recibo ${r.type}` : 'Recibo Nómina';
  return {
    id: Number(r.id),
    name,
    date: r.createdAt ?? new Date(year, Number(month) - 1, 28).toISOString(),
    amount: r.amount ?? 0,
    month,
    year,
    status,
    sector: r.type ?? 'General',
    sent: !!r.isSended,
    read: !!r.isReaded,
  };
}

// Obtiene recibos con filtros de servidor y devuelve una página tipada
export async function fetchReceipts(params?: Record<string, string | number | boolean>): Promise<ReceiptsPage> {
  const qs = params && Object.keys(params).length
    ? '?' + new URLSearchParams(Object.entries(params).reduce<Record<string,string>>((acc,[k,v])=>{acc[k]=String(v);return acc;},{})).toString()
    : '';
  const url = `${API_BASE}/receipts/${qs}`;
  const token = await AsyncStorage.getItem('auth_token');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error al obtener recibos (${res.status})`);
  }
  const json = await res.json();
  const list = Array.isArray(json?.results) ? json.results : Array.isArray(json) ? json : [];
  const items = list.map(mapApiReceipt);
  return {
    items,
    numPages: json?.numPages,
    totalCount: json?.totalCount ?? json?.count,
    perPage: json?.perPage,
    next: json?.next ?? null,
    previous: json?.previous ?? null,
  };
}

// Descarga binaria (mock). En un backend real: `${API_BASE}/receipts/{id}/download` con token
// Descarga binaria de un PDF (mock de ejemplo)
export async function fetchReceiptBinary(id: number): Promise<Blob> {
  const token = await AsyncStorage.getItem('auth_token');
  const url = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token ?? ''}` } });
  if (!res.ok) throw new Error('No se pudo descargar el recibo');
  const blob = await res.blob();
  return blob;
}

// Obtiene el link al PDF del recibo desde la API
// Solicita al backend la URL del archivo PDF de un recibo
export async function fetchReceiptFileUrl(id: number): Promise<string> {
  const token = await AsyncStorage.getItem('auth_token');
  const url = `${API_BASE}/receipts/${id}/file`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `No se pudo obtener el archivo del recibo (${res.status})`);
  }
  const json = await res.json();
  const file = json?.file;
  if (!file || typeof file !== 'string') throw new Error('Respuesta inválida: falta URL del archivo');
  return file;
}
