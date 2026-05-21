import { apiClient } from '../api/apiClient';
import type { TrazabilidadHU, LinkTrazabilidadRequest, ApiResponse } from '../types/api.types';

class TrazabilidadService {
	async linkear(datos: LinkTrazabilidadRequest): Promise<ApiResponse> {
		return await apiClient.post('/api/scrum/trazabilidad', datos);
	}

	async obtenerPorHU(huId: string): Promise<TrazabilidadHU> {
		const response = await apiClient.get<TrazabilidadHU>(`/api/scrum/historias/${huId}/trazabilidad`);
		return response.data!;
	}

	async listarPorRepositorio(repositorio: string): Promise<any[]> {
		const response = await apiClient.get<any[]>(`/api/scrum/trazabilidad/${repositorio}`);
		return response.data || [];
	}

	async buscarPorCommit(sha: string, repositorio: string): Promise<TrazabilidadHU> {
		const response = await apiClient.get<TrazabilidadHU>(
			`/api/scrum/trazabilidad/buscar?sha=${sha}&repositorio=${repositorio}`
		);
		return response.data!;
	}
}

export const trazabilidadService = new TrazabilidadService();
