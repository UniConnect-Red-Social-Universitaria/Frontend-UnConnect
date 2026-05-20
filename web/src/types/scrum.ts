// Tipos para el módulo Scrum - Basados en documentación del backend

export interface Sprint {
  id: string;
  numero: number;
  nombre: string;
  descripcion?: string;
  estado: 'PLANEACION' | 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';
  fechaInicio?: string;
  fechaFin?: string;
  velocidadPlaneada: number;
  velocidadReal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoriaUsuario {
  id: string;
  codigo: string; // HU-001, HU-002, etc
  titulo: string;
  descripcion: string;
  storyPoints: number;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'BLOQUEADA' | 'COMPLETADA' | 'CANCELADA';
  prioridad: number; // 1 (baja) a 5 (crítica)
  asignadoA?: string;
  sprintId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CriterioAceptacion {
  id: string;
  numero: number; // 1, 2, 3...
  descripcion: string;
  huId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluacionCriterio {
  id: string;
  criterioId: string;
  cumplido: boolean;
  observaciones?: string;
  evaluadoPor?: string;
  fechaEvaluacion: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrazabilidadHU {
  id: string;
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
  numeroDespliegue?: number;
  urlDespliegue?: string;
  estadoDespliegue?: string;
  extraido?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Impedimento {
  id: string;
  sprintId?: string;
  descripcion: string;
  estado: 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
  esCritico: boolean;
  diasAbierto: number;
  responsable?: string;
  fechaApertura: string;
  fechaResolucion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricasSprint {
  sprintId: string;
  numero: number;
  velocidadPlaneada: number;
  velocidadReal: number;
  porcentajeCumplimiento: number;
  huTotales: number;
  huCompletadas: number;
  huEnProgreso: number;
  huBloqueadas: number;
  promedio3Sprints?: number;
}

export interface BurndownDato {
  dia: number;
  fecha: string;
  spRestantesReal: number;
  spRestantesIdeal: number;
  huCompletadas: number;
}

export interface BurndownChart {
  sprintId: string;
  totalSpPlaneados: number;
  spCompletados: number;
  proyeccionFinal: number;
  dias: BurndownDato[];
}

export interface CumplimientoSprint {
  sprintId: string;
  criteriosTotales: number;
  criteriosCumplidos: number;
  porcentajeCumplimiento: number;
}

export interface VelocidadHistorica {
  sprintId: string;
  velocidadPlaneada: number;
  velocidadReal: number;
  porcentajeCumplimiento: number;
}

export interface CumplimientoHU {
  cumplidos: number;
  total: number;
  porcentaje: number;
}

export interface Retrospectiva {
  id: string;
  sprintId: string;
  fechaRetrospectiva: string;
  comentariosGenerales?: string;
  acuerdos?: AcuerdoRetro[];
  impedimentos?: ImpedimentoRetro[];
  createdAt: string;
  updatedAt: string;
}

export interface AcuerdoRetro {
  id: string;
  retrospectId: string;
  descripcion: string;
  responsable?: string;
  estado: 'ABIERTO' | 'EN_TRABAJO' | 'COMPLETADO' | 'CANCELADO';
  createdAt: string;
  updatedAt: string;
}

export interface ImpedimentoRetro {
  id: string;
  retrospectId: string;
  descripcion: string;
  impacto: string;
  responsable?: string;
  estado: 'ABIERTO' | 'EN_TRABAJO' | 'COMPLETADO' | 'CANCELADO';
  createdAt: string;
  updatedAt: string;
}
