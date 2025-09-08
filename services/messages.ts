// Servicio de Mensajes (mock)
// - Fuente de datos local para mostrar ejemplos de mensajes/noticias
// - `getMessages` retorna un arreglo estático (puede integrarse a API real luego)
type Message = { id: number; title: string; body: string };

const MESSAGES: Message[] = [
  { id: 1, title: 'Bienvenida', body: 'Nueva plataforma de RRHH disponible.' },
  { id: 2, title: 'Mantenimiento', body: 'Corte programado el sábado 10 a las 22:00.' },
  { id: 3, title: 'Política', body: 'Actualizamos la política de vacaciones.' },
];

export function getMessages() {
  return MESSAGES;
}
