// Servicio de Autenticación
// - `signIn`: login contra API demo y mapeo del usuario a modelo local
// - Persiste token/usuario en AsyncStorage para consumo posterior
// - `safeReadError`: ayuda a leer mensajes de error del backend

import { API_BASE } from './_config';
export type User = { id: number; name: string; email: string; avatar?: string; role?: string; employeeNumber?: number };

// Real login contra API demo_login
// Endpoint: POST /users/demo_login/
// Body: { username, password }
// Inicia sesión con username/password contra el endpoint demo
export async function signIn(
  username: string,
  password: string
): Promise<{ token: string; user: User }> {
  const url = `${API_BASE}/users/demo_login/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || `Login failed (${res.status})`);
  }

  const json = (await res.json()) as {
    user: {
      id: number;
      initials?: string;
      hasPendingReceiptsToSign?: boolean;
      lastLogin?: string;
      isSuperuser?: boolean;
      username: string;
      firstName?: string;
      lastName?: string;
      nationality?: string;
      email: string;
      fullName?: string;
      role?: string;
      dateJoined?: string;
      createdAt?: string;
      modifiedAt?: string;
      address?: string;
      phoneNumber?: string;
      employeeNumber?: number;
      requiredPasswordChangedDone?: boolean;
    };
    token: string;
  };

  // Mapeo de respuesta de API -> modelo local `User`
  const u = json.user;
  const name = u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
  const mapped: User = {
    id: u.id,
    name,
    email: u.email,
    role: u.role,
    employeeNumber: u.employeeNumber,
    avatar: u.initials ? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.initials)}&background=0D8ABC&color=fff` : undefined,
  };

  // Persistimos el token de aplicación (respuesta) y el usuario
  try {
    const storage = (await import('@react-native-async-storage/async-storage')).default;
    await storage.setItem('auth_token', json.token);
    await storage.setItem('auth_user', JSON.stringify(mapped));
  } catch {}

  return { token: json.token, user: mapped };
}

// Intenta leer errores del backend como texto/JSON de forma segura
async function safeReadError(res: Response): Promise<string | undefined> {
  try {
    const t = await res.text();
    if (!t) return undefined;
    try {
      const j = JSON.parse(t);
      return j?.detail || j?.message || t;
    } catch {
      return t;
    }
  } catch {
    return undefined;
  }
}
