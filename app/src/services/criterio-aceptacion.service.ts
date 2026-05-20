import { apiClient } from './api.client';
import { CriterioAceptacion, EvaluacionCriterio, ApiResponse } from '../types/api.types';

export interface CrearCriterioRequest {
    numero: number;
    descripcion: string;
}

class CriterioAceptacionService {
    async listarPorHU(huId: string): Promise<CriterioAceptacion[]> {
        const response = await apiClient.get<CriterioAceptacion[]>(`/api/scrum/historias/${huId}/criterios`);
        return response.data || [];
    }

    async crear(huId: string, datos: CrearCriterioRequest): Promise<ApiResponse<CriterioAceptacion>> {
        return await apiClient.post<CriterioAceptacion>(`/api/scrum/historias/${huId}/criterios`, datos);
    }

    async evaluar(criterioId: string, cumplido: boolean, observaciones?: string): Promise<ApiResponse<EvaluacionCriterio>> {
        return await apiClient.post<EvaluacionCriterio>(`/api/scrum/criterios/${criterioId}/evaluar`, {
            cumplido,
            observaciones: observaciones || '',
        });
    }

    async historial(criterioId: string): Promise<EvaluacionCriterio[]> {
        const response = await apiClient.get<EvaluacionCriterio[]>(`/api/scrum/criterios/${criterioId}/historial`);
        return response.data || [];
    }

    async cumplimientoHU(huId: string): Promise<{ cumplidos: number; total: number; porcentaje: number }> {
        const response = await apiClient.get<{ cumplidos: number; total: number; porcentaje: number }>(
            `/api/scrum/historias/${huId}/cumplimiento`
        );
        return response.data!;
    }
}

export const criterioAceptacionService = new CriterioAceptacionService();
