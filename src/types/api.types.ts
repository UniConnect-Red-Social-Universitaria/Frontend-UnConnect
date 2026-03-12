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

export interface LoginResponse {
    token: string;
    usuario?: Usuario;
}
