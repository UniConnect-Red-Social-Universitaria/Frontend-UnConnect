import { apiClient } from './api.client';
import { Evento, ApiResponse } from '../types/api.types';

export interface CrearEventoRequest {
    titulo: string;
    descripcion?: string;
    fecha: string;
    ubicacion?: string;
}

/**
 * Servicio de eventos
 */
class EventosService {
    /**
     * Obtener todos los eventos
     */
    async getEventos(): Promise<Evento[]> {
        const response = await apiClient.get<Evento[]>('/api/eventos');
        return response.data || [];
    }

    /**
     * Obtener un evento por ID
     */
    async getEvento(eventoId: string): Promise<Evento> {
        const response = await apiClient.get<Evento>(`/api/eventos/${eventoId}`);
        return response.data!;
    }

    /**
     * Crear un nuevo evento
     */
    async crearEvento(datos: CrearEventoRequest): Promise<ApiResponse<Evento>> {
        return await apiClient.post<Evento>('/api/eventos', datos);
    }

    /**
     * Actualizar un evento
     */
    async actualizarEvento(
        eventoId: string,
        datos: Partial<CrearEventoRequest>
    ): Promise<ApiResponse<Evento>> {
        return await apiClient.put<Evento>(`/api/eventos/${eventoId}`, datos);
    }

    /**
     * Eliminar un evento
     */
    async eliminarEvento(eventoId: string): Promise<ApiResponse> {
        return await apiClient.delete(`/api/eventos/${eventoId}`);
    }
}

export const eventosService = new EventosService();
