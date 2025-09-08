// Servicio de Empleados
// - Define el modelo `Employee`
// - Mapea respuestas de API a dicho modelo
// - Expone `fetchEmployees` para obtener la lista (con filtros opcionales)
import { API_BASE } from './_config';
export type Employee = {
  id: number; // Número
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string; // Rol
  cargo: string; // Cargo
  area: string; // Sector / Área
  turno: 'Mañana' | 'Tarde' | 'Noche';
  status: 'Activo' | 'Inactivo';
  tipoRemuneracion: 'Mensual' | 'Quincenal' | 'Semanal';
  nacionalidad: string; // libre, según API (ej: "Aleman")
};

// Mapea un usuario de API al modelo `Employee` usado en la UI
function mapApiUserToEmployee(u: any): Employee {
  const turno: Employee['turno'] = (u.shift as any) ?? 'Mañana';
  const status: Employee['status'] = u.isActive === false ? 'Inactivo' : 'Activo';
  const tipoRem: Employee['tipoRemuneracion'] = (u.payType as any) ?? 'Mensual';
  const nacionalidad = (u.nationality as string) || 'OT';
  return {
    id: Number(u.employeeNumber ?? u.id ?? 0),
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    email: u.email ?? '',
    phone: u.phoneNumber ?? 'N/A',
    role: u.role ?? 'Usuario',
    cargo: u.position ?? u.role ?? 'Funcionario',
    area: u.area ?? u.sector ?? 'General',
    turno,
    status,
    tipoRemuneracion: tipoRem,
    nacionalidad,
  };
}

// Obtiene empleados desde el backend
// - Acepta filtros opcionales vía querystring (e.g., nationality, email, etc.)
export async function fetchEmployees(params?: Record<string, string>): Promise<Employee[]> {
  const qs = params && Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  const url = `${API_BASE}/users/${qs}`;
  const storage = (await import('@react-native-async-storage/async-storage')).default;
  const token = await storage.getItem('auth_token');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error al obtener empleados (${res.status})`);
  }
  const json = await res.json();
  const list = Array.isArray(json?.results) ? json.results : Array.isArray(json) ? json : [];
  return list.map(mapApiUserToEmployee);
}

// Mantener compatibilidad: atajo que llama a `fetchEmployees()` sin filtros
export async function getEmployees() {
  return fetchEmployees();
}
