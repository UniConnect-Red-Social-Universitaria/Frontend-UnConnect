import { apiClient } from '../api/apiClient';
import type { Materia, ApiResponse } from '../types/api.types';

class MateriasService {
	async getMaterias(): Promise<Materia[]> {
		const response = await apiClient.get<any>('/api/catalogos');

		if (response.data) {
			if (Array.isArray(response.data)) return response.data;
			if (Array.isArray(response.data.materias)) return response.data.materias;
		}

		return [];
	}

	async crearMateria(nombre: string, codigo?: string): Promise<ApiResponse<Materia>> {
		return await apiClient.post<Materia>('/api/materias', { nombre, codigo });
	}

	async buscarMaterias(q: string): Promise<Materia[]> {
		const query = encodeURIComponent(q.trim());
		const response = await apiClient.get<Materia[]>(`/api/materias/buscar?q=${query}`);
		return response.data || [];
	}
}

export const materiasService = new MateriasService();
