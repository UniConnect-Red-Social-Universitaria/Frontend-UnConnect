import type { ApiResponse } from '../types/api.types';
// @ts-expect-error - La biblioteca no tiene tipos, pero funciona correctamente
import type { Encuesta } from '@uniconnect/api-types';

const API_URL = `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3000'}/api`;

const getToken = (): string | null => localStorage.getItem('userToken');

type CrearEncuestaInput = {
    pregunta: string;
    opciones: string[];
    autoCloseAt?: string | null;
};

export const encuestasService = {
    obtenerEncuestasDeGrupo: async (grupoId: string): Promise<ApiResponse<Encuesta[]>> => {
        const token = getToken();
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
        const token = getToken();
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

        return res.json();
    },
    votarEnEncuesta: async (encuestaId: string, optionId: string): Promise<ApiResponse<Encuesta>> => {
        const token = getToken();
        if (!token) throw new Error('No autenticado.');

        const res = await fetch(`${API_URL}/encuestas/${encuestaId}/votos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ optionId }),
        });

        return res.json();
    },
};