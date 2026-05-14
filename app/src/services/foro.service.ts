import { apiClient } from './api.client';
import type { ForoPregunta, ForoRespuesta } from '@uniconnect/api-types';

export type { ForoPregunta, ForoRespuesta };

export const foroService = {
  obtenerPreguntas: async (materiaId: string): Promise<ForoPregunta[]> => {
    const res = await apiClient.get(`/api/foro/${materiaId}/preguntas`);
    return res.data;
  },

  publicarPregunta: async (materiaId: string, titulo: string, contenido: string): Promise<ForoPregunta> => {
    const res = await apiClient.post(`/api/foro/${materiaId}/preguntas`, { titulo, contenido });
    return res.data;
  },

  obtenerRespuestas: async (preguntaId: string): Promise<ForoRespuesta[]> => {
    const res = await apiClient.get(`/api/foro/preguntas/${preguntaId}/respuestas`);
    return res.data;
  },

  publicarRespuesta: async (preguntaId: string, materiaId: string, contenido: string): Promise<ForoRespuesta> => {
    const res = await apiClient.post(`/api/foro/preguntas/${preguntaId}/respuestas`, { contenido, materiaId });
    return res.data;
  },

  votarRespuesta: async (respuestaId: string, valor: 1 | -1): Promise<ForoRespuesta> => {
    const res = await apiClient.post(`/api/foro/respuestas/${respuestaId}/votos`, { valor });
    return res.data;
  },
};
