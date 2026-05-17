import { apiClient } from "./api.client";
import { Grupo, ApiResponse } from "../types/api.types";

export interface CrearGrupoRequest {
  nombre: string;
  materiaId: string;
}

export interface SolicitudGrupo {
  id: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  createdAt: string;
  solicitante?: {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
  };
  grupo?: {
    id: string;
    nombre: string;
    materia: { id: string; nombre: string };
  };
}

/**
 * Servicio de grupos
 */
class GruposService {
  /**
   * Obtener todos los grupos
   */
  async getGrupos(): Promise<Grupo[]> {
    const response = await apiClient.get<Grupo[]>("/api/grupos");
    return response.data || [];
  }
  async getGruposDisponibles(): Promise<any[]> {
    const response = await apiClient.get<any[]>("/api/grupos/disponibles");
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
    return await apiClient.post<Grupo>("/api/grupos", datos);
  }

  /**
   * Solicitar ingreso a un grupo (reemplaza unirse directo)
   */
  async solicitarIngreso(grupoId: string): Promise<ApiResponse> {
    return await apiClient.post(`/api/grupos/${grupoId}/solicitar-ingreso`, {});
  }

  /**
   * Salir de un grupo
   */
  async salirDeGrupo(grupoId: string): Promise<ApiResponse> {
    return await apiClient.post(`/api/grupos/${grupoId}/salir`, {});
  }

  /**
   * Abandonar un grupo
   */
  async abandonarGrupo(grupoId: string): Promise<ApiResponse> {
    return await apiClient.delete(`/api/grupos/${grupoId}/abandonar`);
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
    const response = await apiClient.get<any>(
      `/api/grupos/${grupoId}/miembros`,
    );
    // El endpoint retorna { success, data: { miembros: [...], ... } }
    return response.data?.miembros || [];
  }
  /**
   * Agregar un miembro al grupo (solo administrador)
   */
  async agregarMiembro(
    grupoId: string,
    usuarioId: string,
  ): Promise<ApiResponse> {
    return await apiClient.post(`/api/grupos/${grupoId}/miembros`, {
      usuarioId,
    });
  }

  // ── Solicitudes de ingreso a grupo ──

  /**
   * Listar solicitudes pendientes de un grupo (solo admin)
   */
  async getSolicitudesGrupo(grupoId: string): Promise<SolicitudGrupo[]> {
    const response = await apiClient.get<SolicitudGrupo[]>(
      `/api/grupos/${grupoId}/solicitudes`,
    );
    return response.data || [];
  }

  /**
   * Listar mis solicitudes enviadas
   */
  async getMisSolicitudes(): Promise<SolicitudGrupo[]> {
    const response = await apiClient.get<SolicitudGrupo[]>(
      `/api/grupos/mis-solicitudes`,
    );
    return response.data || [];
  }

  /**
   * Aprobar solicitud de ingreso (solo admin)
   */
  async aprobarSolicitud(
    grupoId: string,
    solicitudId: string,
  ): Promise<ApiResponse> {
    return await apiClient.patch(
      `/api/grupos/${grupoId}/solicitudes/${solicitudId}/aprobar`,
      {}
    );
  }

  /**
   * Rechazar solicitud de ingreso (solo admin)
   */
  async rechazarSolicitud(
    grupoId: string,
    solicitudId: string,
  ): Promise<ApiResponse> {
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


