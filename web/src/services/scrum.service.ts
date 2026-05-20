import { apiClient } from '../api/apiClient';
import type {
  Sprint,
  HistoriaUsuario,
  CriterioAceptacion,
  EvaluacionCriterio,
  TrazabilidadHU,
  Impedimento,
  MetricasSprint,
  BurndownChart,
  CumplimientoSprint,
  VelocidadHistorica,
  CumplimientoHU,
  Retrospectiva,
  AcuerdoRetro,
  ImpedimentoRetro,
} from '../types/scrum';

const API_BASE = '/api/scrum';

class ScrumService {
  // ──────────── SPRINTS ────────────
  
  async getSprints(): Promise<Sprint[]> {
    const response = await apiClient.get<Sprint[]>(
      `${API_BASE}/sprints`
    );
    return response.data || [];
  }

  async getSprintById(sprintId: string): Promise<Sprint> {
    const response = await apiClient.get<Sprint>(
      `${API_BASE}/sprints/${sprintId}`
    );
    return response.data!;
  }

  async createSprint(data: {
    numero: number;
    nombre: string;
    descripcion?: string;
    velocidadPlaneada: number;
  }): Promise<Sprint> {
    const response = await apiClient.post<Sprint>(
      `${API_BASE}/sprints`,
      data
    );
    return response.data!;
  }

  async updateSprint(sprintId: string, data: Partial<Sprint>): Promise<Sprint> {
    const response = await apiClient.put<Sprint>(
      `${API_BASE}/sprints/${sprintId}`,
      data
    );
    return response.data!;
  }

  async iniciarSprint(sprintId: string): Promise<Sprint> {
    const response = await apiClient.post<Sprint>(
      `${API_BASE}/sprints/${sprintId}/iniciar`,
      {}
    );
    return response.data!;
  }

  async cerrarSprint(sprintId: string): Promise<Sprint> {
    const response = await apiClient.post<Sprint>(
      `${API_BASE}/sprints/${sprintId}/cerrar`,
      {}
    );
    return response.data!;
  }

  // ──────────── HISTORIAS DE USUARIO ────────────

  async getHistoriasDelSprint(sprintId: string): Promise<HistoriaUsuario[]> {
    const response = await apiClient.get<HistoriaUsuario[]>(
      `${API_BASE}/sprints/${sprintId}/historias`
    );
    return response.data || [];
  }

  async getHistoriaById(huId: string): Promise<HistoriaUsuario> {
    const response = await apiClient.get<HistoriaUsuario>(
      `${API_BASE}/historias/${huId}`
    );
    return response.data!;
  }

  async createHistoria(sprintId: string, data: {
    codigo: string;
    titulo: string;
    descripcion: string;
    storyPoints: number;
    prioridad: number;
  }): Promise<HistoriaUsuario> {
    const response = await apiClient.post<HistoriaUsuario>(
      `${API_BASE}/sprints/${sprintId}/historias`,
      data
    );
    return response.data!;
  }

  async updateHistoria(huId: string, data: Partial<HistoriaUsuario>): Promise<HistoriaUsuario> {
    const response = await apiClient.put<HistoriaUsuario>(
      `${API_BASE}/historias/${huId}`,
      data
    );
    return response.data!;
  }

  async cambiarEstadoHistoria(huId: string, estado: string): Promise<HistoriaUsuario> {
    const response = await apiClient.put<HistoriaUsuario>(
      `${API_BASE}/historias/${huId}/estado`,
      { estado }
    );
    return response.data!;
  }

  async asignarHistoria(huId: string, usuarioId: string | null): Promise<HistoriaUsuario> {
    const response = await apiClient.put<HistoriaUsuario>(
      `${API_BASE}/historias/${huId}/asignar`,
      { usuarioId }
    );
    return response.data!;
  }

  // ──────────── CRITERIOS DE ACEPTACIÓN ────────────

  async getCriteriosDeHU(huId: string): Promise<CriterioAceptacion[]> {
    const response = await apiClient.get<CriterioAceptacion[]>(
      `${API_BASE}/historias/${huId}/criterios`
    );
    return response.data || [];
  }

  async createCriterio(huId: string, data: {
    numero: number;
    descripcion: string;
  }): Promise<CriterioAceptacion> {
    const response = await apiClient.post<CriterioAceptacion>(
      `${API_BASE}/historias/${huId}/criterios`,
      data
    );
    return response.data!;
  }

  async evaluarCriterio(criterioId: string, data: {
    cumplido: boolean;
    observaciones?: string;
  }): Promise<EvaluacionCriterio> {
    const response = await apiClient.post<EvaluacionCriterio>(
      `${API_BASE}/criterios/${criterioId}/evaluar`,
      data
    );
    return response.data!;
  }

  async getHistorialEvaluaciones(criterioId: string): Promise<EvaluacionCriterio[]> {
    const response = await apiClient.get<EvaluacionCriterio[]>(
      `${API_BASE}/criterios/${criterioId}/historial`
    );
    return response.data || [];
  }

  async getCumplimientoHU(huId: string): Promise<CumplimientoHU> {
    const response = await apiClient.get<CumplimientoHU>(
      `${API_BASE}/historias/${huId}/cumplimiento`
    );
    return response.data!;
  }

  // ──────────── MÉTRICAS ────────────

  async getMetricasSprint(sprintId: string): Promise<MetricasSprint> {
    const response = await apiClient.get<MetricasSprint>(
      `${API_BASE}/sprints/${sprintId}/metricas`
    );
    return response.data!;
  }

  async getBurndownChart(sprintId: string): Promise<BurndownChart> {
    const response = await apiClient.get<BurndownChart>(
      `${API_BASE}/sprints/${sprintId}/burndown`
    );
    return response.data!;
  }

  async getCumplimientoSprint(sprintId: string): Promise<CumplimientoSprint> {
    const response = await apiClient.get<CumplimientoSprint>(
      `${API_BASE}/sprints/${sprintId}/cumplimiento`
    );
    return response.data!;
  }

  async getVelocidadHistorica(): Promise<VelocidadHistorica[]> {
    const response = await apiClient.get<VelocidadHistorica[]>(
      `${API_BASE}/metricas/velocidad-historica`
    );
    return response.data || [];
  }

  // ──────────── TRAZABILIDAD ────────────

  async createTrazabilidad(data: {
    huId: string;
    repositorio: 'BACKEND' | 'FRONTEND';
    nombreRepositorio: string;
    shaCommit?: string;
    urlCommit?: string;
    mensajeCommit?: string;
    autorCommit?: string;
    numeroPR?: number;
    urlPR?: string;
    estadoPR?: string;
  }): Promise<TrazabilidadHU> {
    const response = await apiClient.post<TrazabilidadHU>(
      `${API_BASE}/trazabilidad`,
      data
    );
    return response.data!;
  }

  async getTrazabilidadHU(huId: string): Promise<TrazabilidadHU[]> {
    const response = await apiClient.get<TrazabilidadHU[]>(
      `${API_BASE}/historias/${huId}/trazabilidad`
    );
    return response.data || [];
  }

  async getTrazabilidadPorRepositorio(repositorio: 'BACKEND' | 'FRONTEND'): Promise<TrazabilidadHU[]> {
    const response = await apiClient.get<TrazabilidadHU[]>(
      `${API_BASE}/trazabilidad/${repositorio}`
    );
    return response.data || [];
  }

  async buscarTrazabilidad(sha: string, repositorio: 'BACKEND' | 'FRONTEND'): Promise<TrazabilidadHU | null> {
    try {
      const response = await apiClient.get<TrazabilidadHU>(
        `${API_BASE}/trazabilidad/buscar?sha=${encodeURIComponent(sha)}&repositorio=${repositorio}`
      );
      return response.data || null;
    } catch (error) {
      console.error('Error al buscar trazabilidad:', error);
      return null;
    }
  }

  // ──────────── IMPEDIMENTOS ────────────

  async createImpedimento(data: {
    descripcion: string;
    estado?: 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
    responsable?: string;
    sprintId?: string;
  }): Promise<Impedimento> {
    const response = await apiClient.post<Impedimento>(
      `${API_BASE}/impedimentos`,
      data
    );
    return response.data!;
  }

  async getImpedimento(impedimentoId: string): Promise<Impedimento> {
    const response = await apiClient.get<Impedimento>(
      `${API_BASE}/impedimentos/${impedimentoId}`
    );
    return response.data!;
  }

  async getImpedimentosAbiertos(): Promise<Impedimento[]> {
    const response = await apiClient.get<Impedimento[]>(
      `${API_BASE}/impedimentos/abiertos`
    );
    return response.data || [];
  }

  async getImpedimentosCriticos(): Promise<Impedimento[]> {
    const response = await apiClient.get<Impedimento[]>(
      `${API_BASE}/impedimentos/criticos`
    );
    return response.data || [];
  }

  async getImpedimentosDelSprint(sprintId: string): Promise<Impedimento[]> {
    const response = await apiClient.get<Impedimento[]>(
      `${API_BASE}/sprints/${sprintId}/impedimentos`
    );
    return response.data || [];
  }

  async cambiarEstadoImpedimento(impedimentoId: string, estado: string): Promise<Impedimento> {
    const response = await apiClient.put<Impedimento>(
      `${API_BASE}/impedimentos/${impedimentoId}/estado`,
      { estado }
    );
    return response.data!;
  }

  async detectarCriticos(): Promise<{ marcados: number; total: number }> {
    const response = await apiClient.post<{ marcados: number; total: number }>(
      `${API_BASE}/impedimentos/detectar-criticos`,
      {}
    );
    return response.data!;
  }

  // ──────────── RETROSPECTIVAS ────────────

  async createRetrospectiva(sprintId: string, data: {
    fechaRetrospectiva: string;
    comentariosGenerales?: string;
  }): Promise<Retrospectiva> {
    const response = await apiClient.post<Retrospectiva>(
      `${API_BASE}/sprints/${sprintId}/retrospectiva`,
      data
    );
    return response.data!;
  }

  async getRetrospectiva(sprintId: string): Promise<Retrospectiva> {
    const response = await apiClient.get<Retrospectiva>(
      `${API_BASE}/sprints/${sprintId}/retrospectiva`
    );
    return response.data!;
  }

  async createAcuerdo(retrospectId: string, data: {
    descripcion: string;
    responsable?: string;
  }): Promise<AcuerdoRetro> {
    const response = await apiClient.post<AcuerdoRetro>(
      `${API_BASE}/retrospectivas/${retrospectId}/acuerdos`,
      data
    );
    return response.data!;
  }

  async createImpedimentoRetro(retrospectId: string, data: {
    descripcion: string;
    impacto: string;
    responsable?: string;
  }): Promise<ImpedimentoRetro> {
    const response = await apiClient.post<ImpedimentoRetro>(
      `${API_BASE}/retrospectivas/${retrospectId}/impedimentos`,
      data
    );
    return response.data!;
  }

  // ──────────── EXPORTACIÓN ────────────

  async descargarHistoriasCSV(sprintId: string): Promise<Blob> {
    const token = await apiClient.getToken();
    const response = await fetch(
      `${API_BASE}/sprints/${sprintId}/exportar/historias.csv`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return await response.blob();
  }

  async descargarCriteriosCSV(sprintId: string): Promise<Blob> {
    const token = await apiClient.getToken();
    const response = await fetch(
      `${API_BASE}/sprints/${sprintId}/exportar/criterios.csv`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return await response.blob();
  }

  async descargarImpedimentosCSV(sprintId: string): Promise<Blob> {
    const token = await apiClient.getToken();
    const response = await fetch(
      `${API_BASE}/sprints/${sprintId}/exportar/impedimentos.csv`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return await response.blob();
  }

  async descargarReportePDF(sprintId: string, opciones?: {
    trazabilidad?: boolean;
    retrospectiva?: boolean;
    impedimentos?: boolean;
  }): Promise<Blob> {
    const token = await apiClient.getToken();
    let url = `${API_BASE}/sprints/${sprintId}/exportar/reporte.pdf`;
    
    const params: string[] = [];
    if (opciones?.trazabilidad) params.push('trazabilidad=true');
    if (opciones?.retrospectiva) params.push('retrospectiva=true');
    if (opciones?.impedimentos) params.push('impedimentos=true');
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    const response = await fetch(
      url,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return await response.blob();
  }
}

export const scrumService = new ScrumService();
