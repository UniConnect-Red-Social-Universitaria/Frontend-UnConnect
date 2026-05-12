import { apiClient } from '../api/apiClient';
import type { SesionEstudio, SerieEstudio } from '@uniconnect/api-types';

export type FrecuenciaRecurrencia = 'DIARIA' | 'SEMANAL' | 'QUINCENAL';
export type AlcanceModificacion = 'solo_esta' | 'esta_y_siguientes';

export type SesionDTO = SesionEstudio;
export type SerieDTO = SerieEstudio;

class SesionService {
  async crearSerie(data: {
    titulo: string;
    descripcion: string;
    lugar: string;
    frecuencia: FrecuenciaRecurrencia;
    fechaInicio: string;
    fechaFin: string;
    recordatorioMinutos: number;
  }): Promise<SerieDTO> {
    const res = await apiClient.post('/sesiones/series', data);
    return res.data;
  }

  async obtenerSesiones(): Promise<SesionDTO[]> {
    const res = await apiClient.get('/sesiones');
    return res.data;
  }

  async modificarSesion(
    sesionId: string,
    alcance: AlcanceModificacion,
    data: Partial<{ titulo: string; descripcion: string; lugar: string; fecha: string; recordatorioMinutos: number }>,
  ): Promise<SesionDTO[]> {
    const res = await apiClient.patch(`/sesiones/${sesionId}`, { alcance, ...data });
    return res.data;
  }

  async cancelarSesion(sesionId: string, alcance: AlcanceModificacion): Promise<void> {
    await apiClient.post(`/sesiones/${sesionId}/cancelar`, { alcance });
  }
}

export const sesionService = new SesionService();
