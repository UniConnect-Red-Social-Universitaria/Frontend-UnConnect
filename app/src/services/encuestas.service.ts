import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse } from '../types/api.types';
// @ts-expect-error - La biblioteca no tiene tipos, pero funciona correctamente
import type { Encuesta } from '@uniconnect/api-types';
import { resolverApiBaseUrl } from '../utils/apiConfig';

const API_URL = `${resolverApiBaseUrl()}/api`;

const getToken = async () => await AsyncStorage.getItem('userToken');

async function parseJsonResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get('content-type') ?? '';
    const rawBody = await res.text();

    if (!contentType.includes('application/json')) {
        const fragment = rawBody.trim().slice(0, 120);
        throw new Error(
            fragment
                ? `El servidor respondió con un formato no esperado: ${fragment}`
                : 'El servidor respondió con un formato no esperado',
        );
    }

    try {
        return JSON.parse(rawBody) as T;
    } catch {
        throw new Error('No se pudo interpretar la respuesta del servidor');
    }
}

type CrearEncuestaInput = {
    pregunta: string;
    opciones: string[];
    autoCloseAt?: string | null;
};

export const encuestasService = {
    obtenerEncuestasDeGrupo: async (grupoId: string): Promise<ApiResponse<Encuesta[]>> => {
        const token = await getToken();
        if (!token) throw new Error('No autenticado.');

        const res = await fetch(`${API_URL}/encuestas/grupos/${grupoId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        return res.json();
    },
    crearEncuestaEnGrupo: async (
        grupoId: string,
        data: CrearEncuestaInput,
    ): Promise<ApiResponse<Encuesta>> => {
        const token = await getToken();
        if (!token) throw new Error('No autenticado.');

        const res = await fetch(`${API_URL}/encuestas/grupos/${grupoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                pregunta: data.pregunta,
                opciones: data.opciones,
                autoCloseAt: data.autoCloseAt ?? null,
            }),
        });

        return parseJsonResponse<ApiResponse<Encuesta>>(res);
    },
    votarEnEncuesta: async (encuestaId: string, optionId: string): Promise<ApiResponse<Encuesta>> => {
        const token = await getToken();
        if (!token) throw new Error('No autenticado.');

        const res = await fetch(`${API_URL}/encuestas/${encuestaId}/votos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ optionId }),
        });

        return parseJsonResponse<ApiResponse<Encuesta>>(res);
    },
};