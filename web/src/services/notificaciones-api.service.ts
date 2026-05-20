import { resolverApiBaseUrl } from '../utils/apiConfig';

const API_URL = `${resolverApiBaseUrl()}/api/notificaciones`;

export interface NotificacionItem {
  id: string;
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  referenciaId: string | null;
  leida: boolean;
  createdAt: string;
}

export async function fetchNotificaciones(noLeidas = false): Promise<{
  data: NotificacionItem[];
  meta: { noLeidas: number };
}> {
  const token = localStorage.getItem('userToken');
  if (!token) throw new Error('No autenticado');

  const params = noLeidas ? '?noLeidas=true' : '';
  const res = await fetch(`${API_URL}${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Error al obtener notificaciones');
  return json;
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
  const token = localStorage.getItem('userToken');
  if (!token) return;

  await fetch(`${API_URL}/${id}/leer`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function marcarTodasLeidas(): Promise<void> {
  const token = localStorage.getItem('userToken');
  if (!token) return;

  await fetch(`${API_URL}/leer-todas`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}
