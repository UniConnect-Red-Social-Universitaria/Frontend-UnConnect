import { apiClient } from '../api/apiClient';
import type { Impedimento, ImpedimentoEstado, ApiResponse } from '../types/api.types';

export interface CrearImpedimentoRequest {
	descripcion: string;
	responsable?: string;
	sprintId?: string;
	estado?: ImpedimentoEstado;
}

class ImpedimentoService {
	async crear(datos: CrearImpedimentoRequest): Promise<ApiResponse<Impedimento>> {
		return await apiClient.post<Impedimento>('/api/scrum/impedimentos', datos);
	}

	async obtener(impedimentoId: string): Promise<Impedimento> {
		const response = await apiClient.get<Impedimento>(`/api/scrum/impedimentos/${impedimentoId}`);
		return response.data!;
	}

	async listarAbiertos(): Promise<Impedimento[]> {
		const response = await apiClient.get<Impedimento[]>('/api/scrum/impedimentos/abiertos');
		return response.data || [];
	}

	async listarCriticos(): Promise<Impedimento[]> {
		const response = await apiClient.get<Impedimento[]>('/api/scrum/impedimentos/criticos');
		return response.data || [];
	}

	async listarPorSprint(sprintId: string): Promise<Impedimento[]> {
		const response = await apiClient.get<Impedimento[]>(`/api/scrum/sprints/${sprintId}/impedimentos`);
		return response.data || [];
	}

	async actualizarEstado(impedimentoId: string, estado: ImpedimentoEstado): Promise<ApiResponse<Impedimento>> {
		return await apiClient.put<Impedimento>(`/api/scrum/impedimentos/${impedimentoId}/estado`, { estado });
	}

	async detectarCriticos(): Promise<ApiResponse<{ marcados: number; total: number }>> {
		return await apiClient.post<{ marcados: number; total: number }>('/api/scrum/impedimentos/detectar-criticos');
	}
}

export const impedimentoService = new ImpedimentoService();
