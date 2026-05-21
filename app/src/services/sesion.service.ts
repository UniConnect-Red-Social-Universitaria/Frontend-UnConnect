import { apiClient } from './api.client';

export type FrecuenciaRecurrencia = 'DIARIA' | 'SEMANAL' | 'QUINCENAL';
export type AlcanceModificacion = 'solo_esta' | 'esta_y_siguientes';
export type EstadoAsistencia = 'PENDIENTE' | 'CONFIRMADA' | 'DECLINADA';

export type SesionDTO = {
    id: string;
    titulo: string;
    descripcion: string;
    lugar: string;
    fecha: string;
    recordatorioMinutos: number;
    cancelada: boolean;
    modificada: boolean;
    serieId: string;
};

export type SerieDTO = {
    id: string;
    titulo: string;
    frecuencia: FrecuenciaRecurrencia;
    sesiones: SesionDTO[];
};

export type AsistenteDTO = {
    id: string;
    sesionId: string;
    usuarioId: string;
    estado: EstadoAsistencia;
    nombre: string;
    apellido: string;
    createdAt: string;
    updatedAt: string;
};

export type CalendarioSesionDTO = {
    id: string;
    titulo: string;
    descripcion: string;
    lugar: string;
    fecha: string;
    recordatorioMinutos: number;
    cancelada: boolean;
    recurrencia: FrecuenciaRecurrencia | null;
    serieId: string;
    grupoId: string | null;
    grupoNombre: string | null;
    creadorId: string;
    asistentes: AsistenteDTO[];
    miAsistencia: EstadoAsistencia | null;
};

export const sesionService = {
  async crearSerie(data: {
    titulo: string;
    descripcion: string;
    lugar: string;
    frecuencia: FrecuenciaRecurrencia;
    fechaInicio: string;
    fechaFin: string;
    recordatorioMinutos: number;
    grupoId?: string;
  }): Promise<SerieDTO> {
    const res = await apiClient.post('/api/sesiones/series', data);
    return res.data;
  },

  async obtenerSesiones(): Promise<SesionDTO[]> {
    const res = await apiClient.get('/api/sesiones');
    return res.data;
  },

  async obtenerCalendario(): Promise<CalendarioSesionDTO[]> {
    const res = await apiClient.get('/api/sesiones/calendario');
    return res.data || [];
  },

  async obtenerDetalle(sesionId: string): Promise<CalendarioSesionDTO> {
    const res = await apiClient.get(`/api/sesiones/${sesionId}/detalle`);
    return res.data;
  },

  async modificarSesion(
    sesionId: string,
    alcance: AlcanceModificacion,
    data: Partial<{ titulo: string; descripcion: string; lugar: string; fecha: string; recordatorioMinutos: number }>,
  ): Promise<SesionDTO[]> {
    const res = await apiClient.patch(`/api/sesiones/${sesionId}`, { alcance, ...data });
    return res.data;
  },

  async cancelarSesion(sesionId: string, alcance: AlcanceModificacion): Promise<void> {
    await apiClient.post(`/api/sesiones/${sesionId}/cancelar`, { alcance });
  },

  async cancelarMultiples(sesionIds: string[]): Promise<{ canceladas: number }> {
    const res = await apiClient.post('/api/sesiones/cancelar-multiples', { sesionIds });
    return res.data;
  },

  async confirmarAsistencia(sesionId: string): Promise<void> {
    await apiClient.post(`/api/sesiones/${sesionId}/asistir`);
  },

  async declinarAsistencia(sesionId: string): Promise<void> {
    await apiClient.post(`/api/sesiones/${sesionId}/declinar`);
  },
};
