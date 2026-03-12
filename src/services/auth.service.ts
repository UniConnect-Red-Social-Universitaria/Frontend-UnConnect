import { apiClient } from './api.client';
import { LoginRequest, RegistroRequest, LoginResponse, ApiResponse } from '../types/api.types';

/**
 * Servicio de autenticación
 */
class AuthService {
    /**
     * Iniciar sesión
     */
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

    /**
     * Registrar nuevo usuario
     */
    async registro(datos: RegistroRequest): Promise<ApiResponse> {
        const response = await apiClient.publicRequest('/api/usuarios/registro', {
            method: 'POST',
            body: JSON.stringify(datos),
        });

        return response;
    }

    /**
     * Cerrar sesión
     */
    async logout(): Promise<void> {
        try {
            // Intentar notificar al servidor
            await apiClient.post('/api/usuarios/logout');
        } catch (error) {
            // Continuar aunque falle la petición al servidor
            console.log('Error al notificar logout al servidor:', error);
        } finally {
            // Limpiar token local siempre
            await apiClient.removeToken();
        }
    }

    /**
     * Verificar si el usuario está autenticado
     */
    async isAuthenticated(): Promise<boolean> {
        const token = await apiClient.getToken();
        return token !== null;
    }

    /**
     * Obtener el token actual
     */
    async getToken(): Promise<string | null> {
        return await apiClient.getToken();
    }
}

export const authService = new AuthService();
