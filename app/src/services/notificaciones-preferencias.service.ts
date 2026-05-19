import { apiClient } from './api.client'; // Asegúrate de usar la ruta correcta en cada proyecto

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

export interface PreferenciasResponse {
    preferencias: PreferenciaNotificacion[];
}

// Diccionario real con los 9 eventos válidos
export const TIPO_EVENTO_LABELS: Record<TipoEvento, { label: string; emoji: string; desc: string }> = {
    'mensaje': { label: 'Mensajes privados', emoji: '💬', desc: 'Cuando alguien te escribe un mensaje directo' },
    'mensaje-grupo': { label: 'Mensajes de grupo', emoji: '👥', desc: 'Actividad en tus grupos de estudio' },
    'mencion': { label: 'Menciones', emoji: '@', desc: 'Cuando alguien te menciona en un chat' },
    'encuesta': { label: 'Encuestas', emoji: '📊', desc: 'Nuevas encuestas creadas en tus grupos' },
    'recordatorio': { label: 'Recordatorios', emoji: '⏰', desc: 'Avisos de sesiones de estudio y tareas' },
    'evento-academico': { label: 'Eventos académicos', emoji: '🎓', desc: 'Conferencias, talleres y tutorías' },
    'evento-cultural': { label: 'Eventos culturales', emoji: '🎭', desc: 'Exposiciones, cine y arte universitario' },
    'evento-deportivo': { label: 'Eventos deportivos', emoji: '⚽', desc: 'Torneos e inscripciones deportivas' },
    'evento-otro': { label: 'Otros eventos', emoji: '✨', desc: 'Variedades y avisos generales del campus' },
};

export const CANALES: { id: CanalNotificacion; label: string; emoji: string }[] = [
    { id: 'in-app', label: 'En la app', emoji: '🔔' },
    { id: 'email', label: 'Email', emoji: '📧' },
    { id: 'push', label: 'Push', emoji: '📲' },
];

export async function getPreferenciasNotificaciones(): Promise<PreferenciaNotificacion[]> {
    try {
        const res = await apiClient.get<any>('/api/notificaciones/preferencias');
        
        const respuestaBackend = res.success !== undefined ? res : res.data;
        const listaEventos = respuestaBackend?.data;

        if (Array.isArray(listaEventos)) {
            return listaEventos.map((p: any) => ({
                tipoEvento: p.tipoEvento as TipoEvento,
                canales: (p.canalesActivos ?? p.canales ?? []) as CanalNotificacion[],
            }));
        }
        
        console.warn("⚠️ El backend respondió, pero 'data' no es un arreglo válido");
        return getDefaultPreferencias();
    } catch (error) {
        console.error("❌ Error al consultar las preferencias en el servidor:", error);
        return getDefaultPreferencias();
    }
}

export async function updatePreferenciasGlobales(
    canales: CanalNotificacion[]
): Promise<void> {
    await apiClient.put('/api/notificaciones/preferencias', { canales });
}

export function getDefaultPreferencias(): PreferenciaNotificacion[] {
    return (Object.keys(TIPO_EVENTO_LABELS) as TipoEvento[]).map((tipoEvento) => ({
        tipoEvento,
        canales: ['in-app', 'email', 'push'] as CanalNotificacion[],
    }));
}