import { apiClient } from '../api/apiClient';
import type { HistoriaUsuario, ApiResponse, HUEstado } from '../types/api.types';

export interface CrearHURequest {
	codigo: string;
	titulo: string;
	descripcion: string;
	storyPoints: number;
	prioridad?: number;
}

class HistoriaUsuarioService {
	async listarPorSprint(sprintId: string, estado?: HUEstado): Promise<HistoriaUsuario[]> {
		let url = `/api/scrum/sprints/${sprintId}/historias`;
		if (estado) url += `?estado=${estado}`;
		const response = await apiClient.get<HistoriaUsuario[]>(url);
		return response.data || [];
	}

	async obtener(huId: string): Promise<HistoriaUsuario> {
		const response = await apiClient.get<HistoriaUsuario>(`/api/scrum/historias/${huId}`);
		return response.data!;
	}

	async crear(sprintId: string, datos: CrearHURequest): Promise<ApiResponse<HistoriaUsuario>> {
		return await apiClient.post<HistoriaUsuario>(`/api/scrum/sprints/${sprintId}/historias`, datos);
	}

	async actualizar(huId: string, datos: Partial<CrearHURequest>): Promise<ApiResponse<HistoriaUsuario>> {
		return await apiClient.put<HistoriaUsuario>(`/api/scrum/historias/${huId}`, datos);
	}

	async cambiarEstado(huId: string, estado: HUEstado): Promise<ApiResponse<HistoriaUsuario>> {
		return await apiClient.put<HistoriaUsuario>(`/api/scrum/historias/${huId}/estado`, { estado });
	}

	async asignar(huId: string, usuarioId: string | null): Promise<ApiResponse<HistoriaUsuario>> {
		return await apiClient.put<HistoriaUsuario>(`/api/scrum/historias/${huId}/asignar`, { usuarioId });
	}
}

export const historiaUsuarioService = new HistoriaUsuarioService();
