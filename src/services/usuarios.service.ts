import { apiClient } from './api.client';
import { Usuario, Contacto, SolicitudPendiente, ApiResponse } from '../types/api.types';

/**
 * Servicio de usuarios
 */
class UsuariosService {
    /**
     * Obtener perfil del usuario actual
     */
    async getPerfil(): Promise<Usuario> {
        const response = await apiClient.get<Usuario>('/api/usuarios/perfil');
        return response.data!;
    }

    /**
     * Actualizar perfil del usuario
     */
    async updatePerfil(datos: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
        return await apiClient.put<Usuario>('/api/usuarios/perfil', datos);
    }

    /**
     * Obtener todos los usuarios
     */
    async getUsuarios(): Promise<Usuario[]> {
        const response = await apiClient.get<Usuario[]>('/api/usuarios');
        return response.data || [];
    }

    /**
     * Buscar usuarios por materia
     */
    async buscarPorMateria(materiaId: string): Promise<Usuario[]> {
        const response = await apiClient.get<Usuario[]>(
            `/api/usuarios/buscar-por-materia?materia=${materiaId}`
        );
        return response.data || [];
    }

    /**
     * Enviar solicitud de contacto
     */
    async enviarSolicitud(receptorId: string): Promise<ApiResponse> {
        return await apiClient.post('/api/usuarios/solicitudes', { receptorId });
    }

    /**
     * Obtener solicitudes recibidas
     */
    async getSolicitudesRecibidas(): Promise<SolicitudPendiente[]> {
        const response = await apiClient.get<SolicitudPendiente[]>(
            '/api/usuarios/solicitudes-recibidas'
        );
        return response.data || [];
    }

    /**
     * Aceptar solicitud de contacto
     */
    async aceptarSolicitud(solicitudId: string): Promise<ApiResponse> {
        return await apiClient.post('/api/usuarios/solicitudes/aceptar', { solicitudId });
    }

    /**
     * Rechazar solicitud de contacto
     */
    async rechazarSolicitud(solicitudId: string): Promise<ApiResponse> {
        return await apiClient.post('/api/usuarios/solicitudes/rechazar', { solicitudId });
    }

    /**
     * Obtener lista de compañeros/contactos
     */
    async getCompaneros(): Promise<Contacto[]> {
        const response = await apiClient.get<any[]>('/api/usuarios/companeros');

        // Mapear la respuesta al formato esperado
        const contactos = (response.data || []).map((c: any) => ({
            id: c.usuario?.id || c.contactoId || '',
            nombre: c.usuario?.nombre || '',
            correo: c.usuario?.correo || '',
        }));

        return contactos;
    }
}

export const usuariosService = new UsuariosService();
