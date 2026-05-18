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
        const data = res.data?.data;
        if (Array.isArray(data)) {
            return data.map((p: any) => ({
                tipoEvento: p.tipoEvento as TipoEvento,
                canales: (p.canalesActivos ?? p.canales ?? []) as CanalNotificacion[],
            }));
        }
        return getDefaultPreferencias();
    } catch {
        return getDefaultPreferencias();
    }
}

export async function updatePreferenciaNotificacion(
    tipoEvento: TipoEvento,
    canales: CanalNotificacion[],
): Promise<void> {
    await apiClient.put(`/api/notificaciones/preferencias/${tipoEvento}`, { canales });
}

export function getDefaultPreferencias(): PreferenciaNotificacion[] {
    const tiposBackend: TipoEvento[] = [
        'mensaje', 'mensaje-grupo', 'mencion', 'encuesta', 'recordatorio',
        'evento-academico', 'evento-cultural', 'evento-deportivo', 'evento-otro'
    ];
    return tiposBackend.map((tipoEvento) => ({
        tipoEvento,
        canales: ['in-app', 'email', 'push'], // O los que consideres por defecto
    }));
}