// Tipos compartidos para respuestas de la API

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}

export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    carrera?: string;
    semestre?: number;
    fotoPerfil?: string;
    materiasCursando?: string[];
}

export interface Grupo {
    id: string;
    nombre: string;
    materiaId: string;
    materia?: Materia;
    maxIntegrantes: number;
    creadorId: string;
    administradorId?: string;
    estado?: string;
    candidatoAdminId?: string | null;
    createdAt?: string;
    miembros?: Usuario[];
}

export interface Materia {
    id: string;
    nombre: string;
    codigo?: string;
}

export interface Archivo {
    id: string;
    nombre: string;
    tamanoBytes: number;
    grupoId: string;
    subidoPorId: string;
    subidoPor?: Usuario;
    createdAt?: string;
}

export interface Contacto {
    id: string;
    nombre: string;
    correo: string;
}

export interface SolicitudPendiente {
    solicitudId: string;
    solicitanteId: string;
    nombre: string;
    correo: string;
    createdAt?: string;
}

export interface Evento {
    id: string;
    titulo: string;
    descripcion?: string;
    fecha: string;
    ubicacion?: string;
    creadorId: string;
    createdAt?: string;
}

export interface LoginRequest {
    correo: string;
    contrasena: string;
}

export interface RegistroRequest {
    nombre: string;
    apellido: string;
    correo: string;
    googleIdToken?: string;
    contrasena: string;
    carrera: string;
    semestre: number;
    materiasCursando: string[];
}

export interface Carrera {
    id: number;
    nombre: string;
}

export interface MateriaCatalogo {
    id: number;
    nombre: string;
}

export interface LoginResponse {
    token: string;
    usuario?: Usuario;
}

export interface CatalogoData {
    carreras: Carrera[];
    materias: MateriaCatalogo[];
}

export type Insignia = 'fundador' | 'participante-activo' | 'comunicador' | 'colaborador';

export interface EstadisticasPerfil {
    gruposCreados: number;
    gruposParticipa: number;
    mensajesEnviados: number;
}

export interface PerfilBaseDTO {
    id: string;
    nombre: string;
    apellido: string;
    carrera: string;
    semestre: number | null;
    asignaturasActivas: string[];
}

export interface PerfilEnriquecido extends PerfilBaseDTO {
    estadisticas: EstadisticasPerfil;
    insignias: Insignia[];
}

// ── SCRUM TYPES ──

export type SprintEstado = 'PLANEACION' | 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';
export type HUEstado = 'PENDIENTE' | 'EN_PROGRESO' | 'BLOQUEADA' | 'COMPLETADA' | 'CANCELADA';
export type ImpedimentoEstado = 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
export type ImpactoImpedimento = 'Alto' | 'Medio' | 'Bajo';
export type TipoRepositorio = 'BACKEND' | 'FRONTEND';

export interface Sprint {
    id: string;
    numero: number;
    nombre: string;
    descripcion?: string;
    estado: SprintEstado;
    fechaInicio?: string;
    fechaFin?: string;
    velocidadPlaneada: number;
    velocidadReal?: number;
    createdAt: string;
    updatedAt: string;
}

export interface HistoriaUsuario {
    id: string;
    codigo: string;
    titulo: string;
    descripcion: string;
    storyPoints: number;
    estado: HUEstado;
    prioridad: number;
    asignadoA?: string;
    sprintId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CriterioAceptacion {
    id: string;
    numero: number;
    descripcion: string;
    huId: string;
    cumplido: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface EvaluacionCriterio {
    id: string;
    criterioId: string;
    cumplido: boolean;
    observaciones?: string;
    evaluadoPor?: string;
    createdAt: string;
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

export interface BurnDownDia {
    dia: number;
    fecha: string;
    spRestantesReal: number;
    spRestantesIdeal: number;
    huCompletadas: number;
}

export interface BurnDownData {
    sprintId: string;
    totalSpPlaneados: number;
    spCompletados: number;
    proyeccionFinal: number;
    dias: BurnDownDia[];
}

export interface CumplimientoSprint {
    sprintId: string;
    criteriosTotales: number;
    criteriosCumplidos: number;
    porcentajeCumplimiento: number;
}

export interface VelocidadHistorica {
    sprintId: string;
    numero: number;
    nombre?: string;
    velocidadPlaneada: number;
    velocidadReal: number;
    porcentajeCumplimiento: number;
}

export interface TrazabilidadItem {
    id: string;
    repositorio: TipoRepositorio;
    nombreRepositorio: string;
    tipoArtefacto: string;
    enlace: string;
    referencia: string;
    extraido?: string;
}

export interface TrazabilidadHU {
    huId: string;
    codigo: string;
    titulo: string;
    trazas: TrazabilidadItem[];
}

export interface LinkTrazabilidadRequest {
    huId: string;
    repositorio: TipoRepositorio;
    nombreRepositorio: string;
    shaCommit?: string;
    urlCommit?: string;
    mensajeCommit?: string;
    autorCommit?: string;
    numeroPR?: number;
    urlPR?: string;
    estadoPR?: string;
}

export interface Retrospectiva {
    id: string;
    sprintId: string;
    fechaRetrospectiva: string;
    comentariosGenerales?: string;
    acuerdos: AcuerdoRetro[];
    impedimentos: ImpedimentoRetro[];
    createdAt: string;
    updatedAt: string;
}

export interface AcuerdoRetro {
    id: string;
    descripcion: string;
    responsable?: string;
    estado: string;
}

export interface ImpedimentoRetro {
    id: string;
    descripcion: string;
    impacto: ImpactoImpedimento;
    responsable?: string;
    estado: ImpedimentoEstado;
}

export interface Impedimento {
    id: string;
    sprintId?: string;
    descripcion: string;
    estado: ImpedimentoEstado;
    esCritico: boolean;
    diasAbierto: number;
    responsable?: string;
    fechaApertura: string;
    fechaResolucion?: string;
    createdAt: string;
    updatedAt: string;
}
