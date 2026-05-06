export type NivelPrioridad = 'normal' | 'urgente' | 'critica';

export interface Accion {
  label: string;
  endpoint: string;
}

export interface NotificacionBaseDTO {
  mensaje: string;
  destinatario: string;
  timestamp: string;
}

export interface NotificacionConPrioridadDTO extends NotificacionBaseDTO {
  nivel: NivelPrioridad;
}

export interface NotificacionConAccionDTO extends NotificacionBaseDTO {
  accion: Accion;
}

export interface NotificacionCompletaDTO extends NotificacionBaseDTO {
  nivel: NivelPrioridad;
  accion: Accion;
}

export type NotificacionDTO =
  | NotificacionBaseDTO
  | NotificacionConPrioridadDTO
  | NotificacionConAccionDTO
  | NotificacionCompletaDTO;

export function tieneNivel(n: NotificacionDTO): n is NotificacionConPrioridadDTO {
  return 'nivel' in n;
}

export function tieneAccion(n: NotificacionDTO): n is NotificacionConAccionDTO {
  return 'accion' in n;
}
