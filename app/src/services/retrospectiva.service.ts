import { apiClient } from './api.client';
import { Retrospectiva, AcuerdoRetro, ImpedimentoRetro, ApiResponse } from '../types/api.types';

export interface CrearRetrospectivaRequest {
    fechaRetrospectiva: string;
    comentariosGenerales?: string;
    acuerdos?: Array<{ descripcion: string; responsable?: string }>;
    impedimentos?: Array<{ descripcion: string; impacto: string; responsable?: string }>;
}

class RetrospectivaService {
    async obtener(sprintId: string): Promise<Retrospectiva> {
        const response = await apiClient.get<Retrospectiva>(`/api/scrum/sprints/${sprintId}/retrospectiva`);
        return response.data!;
    }

    async crear(sprintId: string, datos: CrearRetrospectivaRequest): Promise<ApiResponse<Retrospectiva>> {
        return await apiClient.post<Retrospectiva>(`/api/scrum/sprints/${sprintId}/retrospectiva`, datos);
    }

    async agregarAcuerdo(retroId: string, descripcion: string, responsable?: string): Promise<ApiResponse<AcuerdoRetro>> {
        return await apiClient.post<AcuerdoRetro>(`/api/scrum/retrospectivas/${retroId}/acuerdos`, {
            descripcion,
            responsable,
        });
    }

    async agregarImpedimento(retroId: string, descripcion: string, impacto: string, responsable?: string): Promise<ApiResponse<ImpedimentoRetro>> {
        return await apiClient.post<ImpedimentoRetro>(`/api/scrum/retrospectivas/${retroId}/impedimentos`, {
            descripcion,
            impacto,
            responsable,
        });
    }
}

export const retrospectivaService = new RetrospectivaService();
