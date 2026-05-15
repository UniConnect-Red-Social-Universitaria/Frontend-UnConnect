import { apiClient } from '../api/apiClient';

export type FrecuenciaRecurrencia = 'DIARIA' | 'SEMANAL' | 'QUINCENAL';
export type AlcanceModificacion = 'solo_esta' | 'esta_y_siguientes';

export type SesionDTO = {
  id: string;
  titulo: string;
  descripcion: string;
  lugar: string;
  fecha: string;
  recordatorioMinutos: number;
  cancelada: boolean;
  serieId: string;
};

export type SerieDTO = {
  id: string;
  titulo: string;
  frecuencia: FrecuenciaRecurrencia;
  sesiones: SesionDTO[];
};

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
    const res = await apiClient.post('/api/sesiones/series', data);
    return res.data;
  }

  async obtenerSesiones(): Promise<SesionDTO[]> {
    const res = await apiClient.get('/api/sesiones');
    return res.data;
  }

  async modificarSesion(
    sesionId: string,
    alcance: AlcanceModificacion,
    data: Partial<{ titulo: string; descripcion: string; lugar: string; fecha: string; recordatorioMinutos: number }>,
  ): Promise<SesionDTO[]> {
    const res = await apiClient.patch(`/api/sesiones/${sesionId}`, { alcance, ...data });
    return res.data;
  }

  async cancelarSesion(sesionId: string, alcance: AlcanceModificacion): Promise<void> {
    await apiClient.post(`/api/sesiones/${sesionId}/cancelar`, { alcance });
  }
}

export const sesionService = new SesionService();
