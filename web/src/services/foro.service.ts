import { apiClient } from '../api/apiClient';

export interface ForoPregunta {
  id: string;
  titulo: string;
  contenido: string;
  autorId: string;
  autorNombre: string;
  materiaId: string;
  createdAt: string;
}

export interface ForoRespuesta {
  id: string;
  contenido: string;
  autorId: string;
  autorNombre: string;
  preguntaId: string;
  puntuacion: number;
  createdAt: string;
}

class ForoService {
  async obtenerPreguntas(materiaId: string): Promise<ForoPregunta[]> {
    const res = await apiClient.get(`/foro/${materiaId}/preguntas`);
    return res.data;
  }

  async publicarPregunta(materiaId: string, titulo: string, contenido: string): Promise<ForoPregunta> {
    const res = await apiClient.post(`/foro/${materiaId}/preguntas`, { titulo, contenido });
    return res.data;
  }

  async obtenerRespuestas(preguntaId: string): Promise<ForoRespuesta[]> {
    const res = await apiClient.get(`/foro/preguntas/${preguntaId}/respuestas`);
    return res.data;
  }

  async publicarRespuesta(preguntaId: string, materiaId: string, contenido: string): Promise<ForoRespuesta> {
    const res = await apiClient.post(`/foro/preguntas/${preguntaId}/respuestas`, { contenido, materiaId });
    return res.data;
  }

  async votarRespuesta(respuestaId: string, valor: 1 | -1): Promise<ForoRespuesta> {
    const res = await apiClient.post(`/foro/respuestas/${respuestaId}/votos`, { valor });
    return res.data;
  }
}

export const foroService = new ForoService();
