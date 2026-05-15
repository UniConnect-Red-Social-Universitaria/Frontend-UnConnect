import { apiClient } from '../api/apiClient';
import type { Evento, ApiResponse } from '../types/api.types';

export interface CrearEventoRequest {
	titulo: string;
	descripcion?: string;
	fechaEvento: string;
	lugar?: string;
	categoria?: 'academico' | 'cultural' | 'deportivo' | 'otro';
}

class EventosService {
	async getEventos(): Promise<Evento[]> {
		const response = await apiClient.get<Evento[]>('/api/eventos');
		return response.data || [];
	}

	async getEvento(eventoId: string): Promise<Evento> {
		const response = await apiClient.get<Evento>(`/api/eventos/${eventoId}`);
		return response.data!;
	}

	async crearEvento(datos: CrearEventoRequest): Promise<ApiResponse<Evento>> {
		return await apiClient.post<Evento>('/api/eventos', datos);
	}

	async actualizarEvento(
		eventoId: string,
		datos: Partial<CrearEventoRequest>
	): Promise<ApiResponse<Evento>> {
		return await apiClient.put<Evento>(`/api/eventos/${eventoId}`, datos);
	}

	async eliminarEvento(eventoId: string): Promise<ApiResponse> {
		return await apiClient.delete(`/api/eventos/${eventoId}`);
	}
}

export const eventosService = new EventosService();
