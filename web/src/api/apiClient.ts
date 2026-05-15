import { createApiClient } from '@uniconnect/api';

const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const storage = {
    async getItem(key: string) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            console.warn('LocalStorage no está disponible', error);
            return null;
        }
    },
    async setItem(key: string, value: string) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            console.warn('No se pudo guardar en LocalStorage', error);
        }
    },
    async removeItem(key: string) {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.warn('No se pudo eliminar de LocalStorage', error);
        }
    },
};

export const apiClient = createApiClient({ baseUrl, storage });
