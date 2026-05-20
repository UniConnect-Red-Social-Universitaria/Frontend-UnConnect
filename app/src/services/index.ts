/**
 * Punto central de exportación de todos los servicios
 */

export { apiClient } from './api.client';
export { authService } from './auth.service';
export { usuariosService } from './usuarios.service';
export { gruposService } from './grupos.service';
export { archivosService } from './archivos.service';
export { eventosService } from './eventos.service';
export { materiasService } from './materias.service';
export { encuestasService } from './encuestas.service';
export { default as notificacionesService } from './notificaciones.service';
export { onboardingService } from './onboarding.service';
export { perfilService } from './perfil.service';
export { sprintService } from './sprint.service';
export { historiaUsuarioService } from './historia-usuario.service';
export { criterioAceptacionService } from './criterio-aceptacion.service';
export { metricasService } from './metricas.service';
export { trazabilidadService } from './trazabilidad.service';
export { retrospectivaService } from './retrospectiva.service';
export { impedimentoService } from './impedimento.service';
export { exportacionService } from './exportacion.service';
export { sesionService } from './sesion.service';

// Re-exportar tipos para conveniencia
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
    PerfilBaseDTO,
    PerfilEnriquecido,
    EstadisticasPerfil,
    Insignia,
    // Scrum
    Sprint,
    HistoriaUsuario,
    CriterioAceptacion,
    MetricasSprint,
    BurnDownData,
    CumplimientoSprint,
    VelocidadHistorica,
    TrazabilidadHU,
    Retrospectiva,
    Impedimento,
} from '../types/api.types';

export type { CrearGrupoRequest } from './grupos.service';
export type { CrearEventoRequest } from './eventos.service';
export type { CrearSprintRequest } from './sprint.service';
export type { CrearHURequest } from './historia-usuario.service';
