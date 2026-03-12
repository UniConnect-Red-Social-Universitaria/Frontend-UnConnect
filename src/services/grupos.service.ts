import { apiClient } from './api.client';
import { Grupo, Materia, ApiResponse } from '../types/api.types';

export interface CrearGrupoRequest {
    nombre: string;
    materiaId: string;
}

/**
 * Servicio de grupos
 */
class GruposService {
    /**
     * Obtener todos los grupos
     */
    async getGrupos(): Promise<Grupo[]> {
        const response = await apiClient.get<Grupo[]>('/api/grupos');
        return response.data || [];
    }

    /**
     * Obtener un grupo por ID
     */
    async getGrupo(grupoId: string): Promise<Grupo> {
        const response = await apiClient.get<Grupo>(`/api/grupos/${grupoId}`);
        return response.data!;
    }

    /**
     * Crear un nuevo grupo
     */
    async crearGrupo(datos: CrearGrupoRequest): Promise<ApiResponse<Grupo>> {
        return await apiClient.post<Grupo>('/api/grupos', datos);
    }

    /**
     * Unirse a un grupo existente
     */
    async unirseAGrupo(grupoId: string): Promise<ApiResponse> {
        return await apiClient.post(`/api/grupos/${grupoId}/unirse`);
    }

    /**
     * Salir de un grupo
     */
    async salirDeGrupo(grupoId: string): Promise<ApiResponse> {
        return await apiClient.post(`/api/grupos/${grupoId}/salir`);
    }

    /**
     * Eliminar un grupo (solo creador)
     */
    async eliminarGrupo(grupoId: string): Promise<ApiResponse> {
        return await apiClient.delete(`/api/grupos/${grupoId}`);
    }

    /**
     * Obtener miembros de un grupo
     */
    async getMiembros(grupoId: string): Promise<any[]> {
        const response = await apiClient.get<any[]>(`/api/grupos/${grupoId}/miembros`);
        return response.data || [];
    }
}

export const gruposService = new GruposService();
