export { authService } from './auth.service';
export { usuariosService } from './usuarios.service';
export { gruposService } from './grupos.service';
export { archivosService } from './archivos.service';
export { eventosService } from './eventos.service';
export { materiasService } from './materias.service';
export { onboardingService } from './onboarding.service';
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
} from '../types/api.types';

export type { CrearGrupoRequest } from './grupos.service';
export type { CrearEventoRequest } from './eventos.service';
