import { apiClient } from '../api/apiClient';
import type { Usuario, Contacto, SolicitudPendiente, ApiResponse } from '../types/api.types';

class UsuariosService {
	async getPerfil(): Promise<Usuario> {
		const response = await apiClient.get<Usuario>('/api/usuarios/perfil');
		return response.data!;
	}

	async updatePerfil(datos: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
		return await apiClient.put<Usuario>('/api/usuarios/perfil', datos);
	}

	async getUsuarios(): Promise<Usuario[]> {
		const response = await apiClient.get<Usuario[]>('/api/usuarios');
		return response.data || [];
	}

	async buscarPorMateria(materiaId: string): Promise<Usuario[]> {
		const response = await apiClient.get<Usuario[]>(
			`/api/usuarios/buscar-por-materia?materia=${materiaId}`
		);
		return response.data || [];
	}

	async enviarSolicitud(receptorId: string): Promise<ApiResponse> {
		return await apiClient.post('/api/usuarios/solicitudes', {
			receptorId,
			usuarioDestinoId: receptorId,
		});
	}

	async getSolicitudesRecibidas(): Promise<SolicitudPendiente[]> {
		const response = await apiClient.get<any[]>('/api/usuarios/solicitudes-recibidas');

		return (response.data || []).map((solicitud: any) => {
			const solicitante = solicitud?.solicitante || {};
			const nombre = [solicitante?.nombre, solicitante?.apellido]
				.filter((parte) => typeof parte === 'string' && parte.trim().length > 0)
				.join(' ');

			return {
				solicitudId: String(solicitud?.solicitudId || solicitud?.id || ''),
				solicitanteId: String(solicitante?.id || solicitud?.solicitanteId || ''),
				nombre,
				correo: String(solicitante?.correo || solicitud?.correo || ''),
				createdAt: solicitud?.createdAt,
			};
		});
	}

	async aceptarSolicitud(solicitudId: string): Promise<ApiResponse> {
		return await apiClient.post('/api/usuarios/solicitudes/aceptar', { solicitudId });
	}

	async rechazarSolicitud(solicitudId: string): Promise<ApiResponse> {
		return await apiClient.post('/api/usuarios/solicitudes/rechazar', { solicitudId });
	}

	async getCompaneros(): Promise<Contacto[]> {
		const response = await apiClient.get<any[]>('/api/usuarios/companeros');

		return (response.data || []).map((c: any) => ({
			id: c.usuario?.id || c.contactoId || '',
			nombre: c.usuario?.nombre || '',
			correo: c.usuario?.correo || '',
		}));
	}

	async buscarUsuarios(query: string): Promise<Usuario[]> {
		if (!query.trim()) return [];

		try {
			const usuarios = await this.getUsuarios();
			const queryLower = query.toLowerCase();

			return usuarios.filter((usuario) => {
				const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.toLowerCase();
				const correo = usuario.correo.toLowerCase();
				return nombreCompleto.includes(queryLower) || correo.includes(queryLower);
			});
		} catch {
			return [];
		}
	}
}

export const usuariosService = new UsuariosService();
