import { apiClient } from '../api/apiClient';
import type { Archivo, ApiResponse } from '../types/api.types';

class ArchivosService {
	async getArchivosPorGrupo(grupoId: string): Promise<Archivo[]> {
		const response = await apiClient.get<Archivo[]>(`/api/grupos/${grupoId}/archivos`);
		return response.data || [];
	}

	/**
	 * Subir un archivo a un grupo desde el navegador (usa File nativo del DOM)
	 */
	async subirArchivo(grupoId: string, file: File): Promise<ApiResponse<Archivo>> {
		const formData = new FormData();
		formData.append('file', file);

		const token = await apiClient.getToken();
		const baseUrl = apiClient.getBaseUrl();

		const response = await fetch(`${baseUrl}/api/grupos/${grupoId}/archivos`, {
			method: 'POST',
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: formData,
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || 'Error al subir archivo');
		}

		return data;
	}

	async getDownloadRequest(
		grupoId: string,
		archivoId: string
	): Promise<{ url: string; headers: Record<string, string> }> {
		const token = await apiClient.getToken();
		const baseUrl = apiClient.getBaseUrl().replace(/\/+$/, '');
		return {
			url: `${baseUrl}/api/grupos/${grupoId}/archivos/${archivoId}/descargar`,
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		};
	}

	async eliminarArchivo(archivoId: string): Promise<ApiResponse> {
		return await apiClient.delete(`/api/archivos/${archivoId}`);
	}

	async getArchivo(archivoId: string): Promise<Archivo> {
		const response = await apiClient.get<Archivo>(`/api/archivos/${archivoId}`);
		return response.data!;
	}
}

export const archivosService = new ArchivosService();
