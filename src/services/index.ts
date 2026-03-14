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
export { default as notificacionesService } from './notificaciones.service';

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
} from '../types/api.types';

export type { CrearGrupoRequest } from './grupos.service';
export type { CrearEventoRequest } from './eventos.service';
