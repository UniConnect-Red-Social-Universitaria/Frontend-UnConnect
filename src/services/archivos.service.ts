import { apiClient } from "./api.client";
import { Archivo, ApiResponse } from "../types/api.types";

/**
 * Servicio de archivos
 */
class ArchivosService {
  /**
   * Obtener todos los archivos de un grupo
   */
  async getArchivosPorGrupo(grupoId: string): Promise<Archivo[]> {
    const response = await apiClient.get<Archivo[]>(
      `/api/grupos/${grupoId}/archivos`,
    );
    return response.data || [];
  }

  /**
   * Subir un archivo a un grupo
   */
  async subirArchivo(
    grupoId: string,
    archivo: { uri: string; name: string; type: string },
  ): Promise<ApiResponse<Archivo>> {
    const formData = new FormData();
    formData.append("file", {
      uri: archivo.uri,
      name: archivo.name,
      type: archivo.type,
    } as any);

    const token = await apiClient.getToken();
    const baseUrl = apiClient["baseUrl"];

    const response = await fetch(`${baseUrl}/api/grupos/${grupoId}/archivos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al subir archivo");
    }

    return data;
  }

  /**
   * Descargar un archivo (obtiene la URL para descarga)
   */
  async descargarArchivo(grupoId: string, archivoId: string): Promise<string> {
    const token = await apiClient.getToken();
    const baseUrl = apiClient["baseUrl"];
    return `${baseUrl}/api/grupos/${grupoId}/archivos/${archivoId}/descargar?token=${token}`;
  }

  /**
   * Eliminar un archivo
   */
  async eliminarArchivo(archivoId: string): Promise<ApiResponse> {
    return await apiClient.delete(`/api/archivos/${archivoId}`);
  }

  /**
   * Obtener información de un archivo
   */
  async getArchivo(archivoId: string): Promise<Archivo> {
    const response = await apiClient.get<Archivo>(`/api/archivos/${archivoId}`);
    return response.data!;
  }
}

export const archivosService = new ArchivosService();
