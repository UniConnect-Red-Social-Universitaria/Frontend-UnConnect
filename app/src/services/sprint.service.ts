import { apiClient } from './api.client';
import { Sprint, ApiResponse } from '../types/api.types';

export interface CrearSprintRequest {
    numero: number;
    nombre: string;
    descripcion?: string;
    velocidadPlaneada: number;
}

class SprintService {
    async listar(activos?: boolean): Promise<Sprint[]> {
        const url = activos ? '/api/scrum/sprints?activos=true' : '/api/scrum/sprints';
        const response = await apiClient.get<Sprint[]>(url);
        return response.data || [];
    }

    async obtener(sprintId: string): Promise<Sprint> {
        const response = await apiClient.get<Sprint>(`/api/scrum/sprints/${sprintId}`);
        return response.data!;
    }

    async crear(datos: CrearSprintRequest): Promise<ApiResponse<Sprint>> {
        return await apiClient.post<Sprint>('/api/scrum/sprints', datos);
    }

    async actualizar(sprintId: string, datos: Partial<CrearSprintRequest & { estado: string }>): Promise<ApiResponse<Sprint>> {
        return await apiClient.put<Sprint>(`/api/scrum/sprints/${sprintId}`, datos);
    }

    async iniciar(sprintId: string): Promise<ApiResponse<Sprint>> {
        return await apiClient.post<Sprint>(`/api/scrum/sprints/${sprintId}/iniciar`);
    }

    async cerrar(sprintId: string): Promise<ApiResponse<Sprint>> {
        return await apiClient.post<Sprint>(`/api/scrum/sprints/${sprintId}/cerrar`);
    }
}

export const sprintService = new SprintService();
