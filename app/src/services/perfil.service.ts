import { apiClient } from "./api.client";
import {
  PerfilBaseDTO,
  PerfilEnriquecido,
} from "../types/api.types";

/**
 * Servicio para consumir endpoints de perfil del usuario
 * Implementa el patrón Decorator del backend
 */
class PerfilService {
  /**
   * Obtiene el perfil base de un usuario (público, sin costo computacional)
   * @param usuarioId - ID del usuario en MongoDB
   * @returns PerfilBaseDTO con datos básicos
   */
  async obtenerPerfilBase(usuarioId: string): Promise<PerfilBaseDTO> {
    const response = await apiClient.publicRequest<PerfilBaseDTO>(
      `/api/usuarios/perfil/${usuarioId}`,
      {
        method: "GET",
      }
    );

    if (!response.data) {
      throw new Error("No se pudo obtener el perfil base del usuario");
    }

    return response.data;
  }

  /**
   * Obtiene el perfil enriquecido con estadísticas e insignias
   * Requiere JWT en Authorization header
   * @param usuarioId - ID del usuario en MongoDB
   * @returns PerfilEnriquecido con perfil base + estadísticas + insignias
   */
  async obtenerPerfilEnriquecido(usuarioId: string): Promise<PerfilEnriquecido> {
    const response = await apiClient.request(
      `/api/usuarios/perfil/${usuarioId}/estadisticas`,
      { method: "GET" }
    );

    if (!response.data) {
      throw new Error("No se pudo obtener el perfil enriquecido del usuario");
    }

    return response.data as PerfilEnriquecido;
  }

  /**
   * Alternativa: Obtiene perfil base usando query parameter
   * @param usuarioId - ID del usuario
   * @param vista - Tipo de vista ('completa' para perfil base con query)
   */
  async obtenerPerfilConVista(
    usuarioId: string,
    vista: "completa" = "completa"
  ): Promise<PerfilBaseDTO> {
    const response = await apiClient.publicRequest<PerfilBaseDTO>(
      `/api/usuarios/perfil/${usuarioId}?vista=${vista}`,
      {
        method: "GET",
      }
    );

    if (!response.data) {
      throw new Error("No se pudo obtener el perfil del usuario");
    }

    return response.data;
  }
}

export const perfilService = new PerfilService();
