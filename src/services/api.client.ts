import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolverApiBaseUrl } from '../utils/apiConfig';
import { ApiResponse } from '../types/api.types';

// Constantes
const TOKEN_KEY = 'userToken';
const USER_ID_KEY = 'userId';

/**
 * Cliente HTTP base para todas las llamadas a la API
 */
class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = resolverApiBaseUrl();
    }

    /**
     * Obtiene el token de autenticación almacenado
     */
    async getToken(): Promise<string | null> {
        return await AsyncStorage.getItem(TOKEN_KEY);
    }

    /**
     * Guarda el token de autenticación
     */
    async setToken(token: string): Promise<void> {
        await AsyncStorage.setItem(TOKEN_KEY, token);
    }

    /**
     * Elimina el token de autenticación
     */
    async removeToken(): Promise<void> {
        await AsyncStorage.removeItem(TOKEN_KEY);
    }

    /**
     * Obtiene el ID del usuario almacenado
     */
    async getUserId(): Promise<string | null> {
        return await AsyncStorage.getItem(USER_ID_KEY);
    }

    /**
     * Guarda el ID del usuario
     */
    async setUserId(userId: string): Promise<void> {
        await AsyncStorage.setItem(USER_ID_KEY, userId);
    }

    /**
     * Realiza una petición HTTP genérica
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const token = await this.getToken();

        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string>),
        };

        // Solo agregar Content-Type si hay un body o si es un método que espera datos
        if (options.body || ['POST', 'PUT', 'PATCH'].includes(options.method || '')) {
            headers['Content-Type'] = 'application/json';
            // Asegurar que haya un body válido para JSON si se envió undefined
            if (!options.body) {
                options.body = '{}';
            }
        }

        // Agregar token si existe
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const contentType = response.headers.get('content-type') || '';
            const rawBody = await response.text();

            if (!contentType.includes('application/json')) {
                if (!response.ok) {
                    throw new Error(`Error del servidor. Inténtalo de nuevo más tarde.`);
                }

                throw new Error(`Respuesta inesperada del servidor.`);
            }

            const data = rawBody ? JSON.parse(rawBody) : {};

            if (!response.ok) {
                // Solo mandamos el mensaje del backend o uno genérico
                throw new Error(data.message || `Error en la solicitud al servidor.`);
            }

            return data;
        } catch (error) {
            // Imprimir error técnico en consola para debugging
            console.error(`[API ${options.method || 'GET'} ${endpoint}]`, error);

            if (error instanceof Error) {
                // Revisar si es un error de fetch (network error)
                if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
                    throw new Error('Error de conexión con el servidor. Revisa tu internet.');
                }
                throw error;
            }
            throw new Error('Error de conexión con el servidor.');
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    /**
     * Request sin autenticación (para login/registro)
     */
    async publicRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string>),
        };

        if (options.body || ['POST', 'PUT', 'PATCH'].includes(options.method || '')) {
            headers['Content-Type'] = 'application/json';
            if (!options.body) {
                options.body = '{}';
            }
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const contentType = response.headers.get('content-type') || '';
            const rawBody = await response.text();

            if (!contentType.includes('application/json')) {
                if (!response.ok) {
                    throw new Error(`Error del servidor. Inténtalo de nuevo más tarde.`);
                }

                throw new Error(`Respuesta inesperada del servidor.`);
            }

            const data = rawBody ? JSON.parse(rawBody) : {};

            if (!response.ok) {
                throw new Error(data.message || `Error en la solicitud al servidor.`);
            }

            return data;
        } catch (error) {
            // Imprimir error técnico en consola para debugging
            console.error(`[API PUBLIC ${options.method || 'GET'} ${endpoint}]`, error);

            if (error instanceof Error) {
                if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
                    throw new Error('Error de conexión con el servidor. Revisa tu internet.');
                }
                throw error;
            }
            throw new Error('Error de conexión con el servidor.');
        }
    }
}

// Exportar instancia singleton
export const apiClient = new ApiClient();
