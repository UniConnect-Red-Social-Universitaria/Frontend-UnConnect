import { apiClient } from './api.client';

export interface Recurso {
    id: string;
    titulo: string;
    contenido: string;
    tipo: string;
    metadata: any;
    grupoId: string;
    creadorId: string;
    creador: { nombre: string; apellido: string };
    createdAt: string;
}

class RecursosService {
    async getRecursos(grupoId: string): Promise<Recurso[]> {
        const data = await apiClient.get(`/api/recursos/grupo/${grupoId}`);
        return (data as any) || [];
    }

    async crearRecurso(data: { titulo: string; contenido: string; tipo: string; grupoId: string; metadata?: any }): Promise<Recurso> {
        const result = await apiClient.post('/api/recursos', data);
        return result as unknown as Recurso;
    }

    async eliminarRecurso(id: string): Promise<void> {
        await apiClient.delete(`/api/recursos/${id}`);
    }
}

export const recursosService = new RecursosService();
