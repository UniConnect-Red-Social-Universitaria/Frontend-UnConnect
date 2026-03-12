import { apiClient } from './api.client';
import { Materia, ApiResponse } from '../types/api.types';

/**
 * Servicio de materias y catálogos
 */
class MateriasService {
    /**
     * Obtener todas las materias del catálogo
     */
    async getMaterias(): Promise<Materia[]> {
        const response = await apiClient.get<any>('/api/catalogos');

        // El catálogo puede retornar un objeto con materias o directamente un array
        if (response.data) {
            if (Array.isArray(response.data)) {
                return response.data;
            }
            if (Array.isArray(response.data.materias)) {
                return response.data.materias;
            }
        }

        return [];
    }

    /**
     * Crear una nueva materia
     */
    async crearMateria(nombre: string, codigo?: string): Promise<ApiResponse<Materia>> {
        return await apiClient.post<Materia>('/api/materias', { nombre, codigo });
    }

    /**
     * Poblar catálogo (para desarrollo/pruebas)
     */
    async poblarCatalogo(): Promise<ApiResponse> {
        return await apiClient.post('/api/catalogos/poblar');
    }
}

export const materiasService = new MateriasService();
