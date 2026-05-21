import { apiClient } from '../api/apiClient';
// @ts-expect-error - La biblioteca no tiene tipos, pero funciona correctamente
import type { ForoPregunta, ForoRespuesta } from '@uniconnect/api-types';

export type { ForoPregunta, ForoRespuesta };

class ForoService {
  async obtenerPreguntas(materiaId: string): Promise<ForoPregunta[]> {
    const res = await apiClient.get(`/api/foro/${materiaId}/preguntas`);
    return res.data;
  }

  async publicarPregunta(materiaId: string, titulo: string, contenido: string): Promise<ForoPregunta> {
    const res = await apiClient.post(`/api/foro/${materiaId}/preguntas`, { titulo, contenido });
    return res.data;
  }

  async obtenerRespuestas(preguntaId: string): Promise<ForoRespuesta[]> {
    const res = await apiClient.get(`/api/foro/preguntas/${preguntaId}/respuestas`);
    return res.data;
  }

  async publicarRespuesta(preguntaId: string, materiaId: string, contenido: string): Promise<ForoRespuesta> {
    const res = await apiClient.post(`/api/foro/preguntas/${preguntaId}/respuestas`, { contenido, materiaId });
    return res.data;
  }

  async cerrarPregunta(preguntaId: string): Promise<ForoPregunta> {
    const res = await apiClient.patch(`/api/foro/preguntas/${preguntaId}/cerrar`);
    return res.data;
  }

  async votarRespuesta(respuestaId: string, valor: 1 | -1): Promise<ForoRespuesta> {
    const res = await apiClient.post(`/api/foro/respuestas/${respuestaId}/votos`, { valor });
    return res.data;
  }
}

export const foroService = new ForoService();
