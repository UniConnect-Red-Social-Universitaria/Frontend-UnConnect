import { apiClient } from '../api/apiClient';
import type { Grupo, ApiResponse } from '../types/api.types';
import type { SolicitudGrupo } from '../types/api.types';

export interface CrearGrupoRequest {
	nombre: string;
	materiaId: string;
}

class GruposService {
	async getGrupos(): Promise<Grupo[]> {
		const response = await apiClient.get<Grupo[]>('/api/grupos');
		return response.data || [];
	}

	async getGruposDisponibles(): Promise<any[]> {
		const response = await apiClient.get<any[]>('/api/grupos/disponibles');
		return response.data || [];
	}

	async getGrupo(grupoId: string): Promise<Grupo> {
		const response = await apiClient.get<Grupo>(`/api/grupos/${grupoId}`);
		return response.data!;
	}

	async crearGrupo(datos: CrearGrupoRequest): Promise<ApiResponse<Grupo>> {
		return await apiClient.post<Grupo>('/api/grupos', datos);
	}

	async solicitarIngreso(grupoId: string): Promise<ApiResponse> {
		return await apiClient.post(`/api/grupos/${grupoId}/solicitar-ingreso`, {});
	}

	async salirDeGrupo(grupoId: string): Promise<ApiResponse> {
		return await apiClient.post(`/api/grupos/${grupoId}/salir`, {});
	}

	async abandonarGrupo(grupoId: string): Promise<ApiResponse> {
		return await apiClient.delete(`/api/grupos/${grupoId}/abandonar`);
	}

	async eliminarGrupo(grupoId: string): Promise<ApiResponse> {
		return await apiClient.delete(`/api/grupos/${grupoId}`);
	}

	async getMiembros(grupoId: string): Promise<any[]> {
		const response = await apiClient.get<any>(`/api/grupos/${grupoId}/miembros`);
		return response.data?.miembros || [];
	}

	async agregarMiembro(grupoId: string, usuarioId: string): Promise<ApiResponse> {
		return await apiClient.post(`/api/grupos/${grupoId}/miembros`, { usuarioId });
	}

	async getSolicitudesGrupo(grupoId: string): Promise<SolicitudGrupo[]> {
		const response = await apiClient.get<SolicitudGrupo[]>(`/api/grupos/${grupoId}/solicitudes`);
		return response.data || [];
	}

	async getMisSolicitudes(): Promise<SolicitudGrupo[]> {
		const response = await apiClient.get<SolicitudGrupo[]>('/api/grupos/mis-solicitudes');
		return response.data || [];
	}

	async aprobarSolicitud(grupoId: string, solicitudId: string): Promise<ApiResponse> {
		return await apiClient.patch(
			`/api/grupos/${grupoId}/solicitudes/${solicitudId}/aprobar`,
			{}
		);
	}

	async rechazarSolicitud(grupoId: string, solicitudId: string): Promise<ApiResponse> {
		return await apiClient.patch(
			`/api/grupos/${grupoId}/solicitudes/${solicitudId}/rechazar`,
			{}
		);
	}

	async iniciarTransferencia(grupoId: string, candidatoId: string): Promise<ApiResponse> {
		return await apiClient.post(`/api/grupos/${grupoId}/administrador/iniciar`, { candidatoId });
	}

	async aceptarTransferencia(grupoId: string): Promise<ApiResponse> {
		return await apiClient.post(`/api/grupos/${grupoId}/administrador/aceptar`, {});
	}

	async rechazarTransferencia(grupoId: string): Promise<ApiResponse> {
		return await apiClient.post(`/api/grupos/${grupoId}/administrador/rechazar`, {});
	}

	async cancelarTransferencia(grupoId: string): Promise<ApiResponse> {
		return await apiClient.delete(`/api/grupos/${grupoId}/administrador/cancelar`);
	}
}

export const gruposService = new GruposService();
