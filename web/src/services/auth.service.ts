import { apiClient } from '../api/apiClient';
import type { LoginResponse, RegistroRequest, ApiResponse, Usuario } from '../types/api.types';
import { jwtDecode } from 'jwt-decode';
import type { JwtPayload } from 'jwt-decode';

interface CustomJwt extends JwtPayload {
	id?: string;
	userId?: string;
	usuarioId?: string;
	sub?: string;
}

class AuthService {
	async login(correo: string, contrasena: string): Promise<LoginResponse> {
		const response = await apiClient.publicRequest<LoginResponse>(
			'/api/usuarios/login',
			{
				method: 'POST',
				body: JSON.stringify({ correo: correo.trim(), contrasena }),
			}
		);

		if (response.data?.token) {
			await apiClient.setToken(response.data.token);
		}

		return response.data!;
	}

	async registro(datos: RegistroRequest): Promise<ApiResponse<Usuario>> {
		const response = await apiClient.publicRequest<Usuario>(
			'/api/usuarios/registro',
			{
				method: 'POST',
				body: JSON.stringify(datos),
			}
		);

		if (response) {
			await this.login(datos.correo, datos.contrasena);
		}

		return response;
	}

	async logout(): Promise<void> {
		try {
			await apiClient.post('/api/usuarios/logout');
		} catch (error) {
			console.log('Error al notificar logout al servidor:', error);
		} finally {
			await apiClient.removeToken();
		}
	}

	async isAuthenticated(): Promise<boolean> {
		const token = await apiClient.getToken();
		return token !== null;
	}

	async getToken(): Promise<string | null> {
		return await apiClient.getToken();
	}

	async obtenerIdUsuarioActual(): Promise<string | null> {
		try {
			const token = await this.getToken();
			if (!token) return null;

			const decoded = jwtDecode<CustomJwt>(token);
			return decoded.sub || decoded.id || decoded.userId || decoded.usuarioId || null;
		} catch (e) {
			console.error('Error decodificando el token:', e);
			return null;
		}
	}
}

export const authService = new AuthService();
