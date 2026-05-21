export { authService } from './auth.service';
export { usuariosService } from './usuarios.service';
export { gruposService } from './grupos.service';
export { archivosService } from './archivos.service';
export { eventosService } from './eventos.service';
export { materiasService } from './materias.service';
export { encuestasService } from './encuestas.service';
export { onboardingService } from './onboarding.service';
export { sprintService } from './sprint.service';
export { historiaUsuarioService } from './historia-usuario.service';
export { criterioAceptacionService } from './criterio-aceptacion.service';
export { metricasService } from './metricas.service';
export { trazabilidadService } from './trazabilidad.service';
export { retrospectivaService } from './retrospectiva.service';
export { impedimentoService } from './impedimento.service';
export { exportacionService } from './exportacion.service';
export { apiClient } from '../api/apiClient';

// Re-exportar tipos
export type {
	ApiResponse,
	Usuario,
	Grupo,
	Materia,
	Archivo,
	Contacto,
	SolicitudPendiente,
	Evento,
	LoginRequest,
	RegistroRequest,
	LoginResponse,
	SolicitudGrupo,
	// Scrum
	Sprint,
	SprintEstado,
	HistoriaUsuario,
	HUEstado,
	CriterioAceptacion,
	EvaluacionCriterio,
	MetricasSprint,
	BurnDownData,
	BurnDownDia,
	CumplimientoSprint,
	VelocidadHistorica,
	TrazabilidadHU,
	TrazabilidadItem,
	LinkTrazabilidadRequest,
	Retrospectiva,
	AcuerdoRetro,
	ImpedimentoRetro,
	Impedimento,
	ImpedimentoEstado,
	TipoRepositorio,
} from '../types/api.types';

export type { CrearGrupoRequest } from './grupos.service';
export type { CrearEventoRequest } from './eventos.service';
export type { CrearSprintRequest } from './sprint.service';
export type { CrearHURequest } from './historia-usuario.service';
export type { CrearCriterioRequest } from './criterio-aceptacion.service';
export type { CrearRetrospectivaRequest } from './retrospectiva.service';
export type { CrearImpedimentoRequest } from './impedimento.service';
