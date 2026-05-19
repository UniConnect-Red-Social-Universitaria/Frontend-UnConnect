import { apiClient } from '../api/apiClient';

export type CanalNotificacion = 'in-app' | 'email' | 'push';

export type TipoEvento =
    | 'mensaje'
    | 'mensaje-grupo'
    | 'mencion'
    | 'encuesta'
    | 'recordatorio'
    | 'evento-academico'
    | 'evento-cultural'
    | 'evento-deportivo'
    | 'evento-otro';

export interface PreferenciaNotificacion {
    tipoEvento: TipoEvento;
    canales: CanalNotificacion[];
}

export const CANALES: { id: CanalNotificacion; label: string; emoji: string }[] = [
    { id: 'in-app', label: 'En la app', emoji: '🔔' },
    { id: 'email', label: 'Email', emoji: '📧' },
    { id: 'push', label: 'Push', emoji: '📲' },
];

export async function getPreferenciasNotificaciones(): Promise<PreferenciaNotificacion[]> {
    try {
        const res = await apiClient.get('/api/notificaciones/preferencias');
        
        const respuestaBackend = res.success !== undefined ? res : res.data;
        const listaEventos = respuestaBackend?.data;

        if (Array.isArray(listaEventos)) {
            return listaEventos.map((p: any) => ({
                tipoEvento: p.tipoEvento as TipoEvento,
                canales: (p.canalesActivos ?? p.canales ?? []) as CanalNotificacion[],
            }));
        }
        
        console.warn("⚠️ El backend respondió, pero 'data' no es un arreglo válido:", res);
        return [];
    } catch (error) {
        console.error("❌ Error al consultar las preferencias en el servidor:", error);
        return [];
    }
}

export async function updatePreferenciasGlobales(canales: CanalNotificacion[]): Promise<void> {
    await apiClient.put('/api/notificaciones/preferencias', { canales });
}

export function getDefaultPreferencias(): PreferenciaNotificacion[] {
    const tiposBackend: TipoEvento[] = [
        'mensaje', 'mensaje-grupo', 'mencion', 'encuesta', 'recordatorio',
        'evento-academico', 'evento-cultural', 'evento-deportivo', 'evento-otro'
    ];
    return tiposBackend.map((tipoEvento) => ({
        tipoEvento,
        canales: ['in-app', 'email', 'push'],
    }));
}