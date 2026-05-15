import { z } from 'zod';
export declare const ForoPreguntaSchema: z.ZodObject<{
    id: z.ZodString;
    titulo: z.ZodString;
    contenido: z.ZodString;
    autorId: z.ZodString;
    autorNombre: z.ZodString;
    materiaId: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    titulo: string;
    contenido: string;
    autorId: string;
    autorNombre: string;
    materiaId: string;
    createdAt: string;
}, {
    id: string;
    titulo: string;
    contenido: string;
    autorId: string;
    autorNombre: string;
    materiaId: string;
    createdAt: string;
}>;
export declare const ForoRespuestaSchema: z.ZodObject<{
    id: z.ZodString;
    contenido: z.ZodString;
    autorId: z.ZodString;
    autorNombre: z.ZodString;
    preguntaId: z.ZodString;
    puntuacion: z.ZodNumber;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    contenido: string;
    autorId: string;
    autorNombre: string;
    createdAt: string;
    preguntaId: string;
    puntuacion: number;
}, {
    id: string;
    contenido: string;
    autorId: string;
    autorNombre: string;
    createdAt: string;
    preguntaId: string;
    puntuacion: number;
}>;
export declare const EventoSchema: z.ZodObject<{
    id: z.ZodString;
    titulo: z.ZodString;
    descripcion: z.ZodString;
    lugar: z.ZodOptional<z.ZodString>;
    fechaEvento: z.ZodString;
    categoria: z.ZodEnum<["academico", "cultural", "deportivo", "otro"]>;
    creadorId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    titulo: string;
    descripcion: string;
    fechaEvento: string;
    categoria: "academico" | "cultural" | "deportivo" | "otro";
    creadorId: string;
    lugar?: string | undefined;
}, {
    id: string;
    titulo: string;
    descripcion: string;
    fechaEvento: string;
    categoria: "academico" | "cultural" | "deportivo" | "otro";
    creadorId: string;
    lugar?: string | undefined;
}>;
export declare const SesionEstudioSchema: z.ZodObject<{
    id: z.ZodString;
    titulo: z.ZodString;
    descripcion: z.ZodString;
    lugar: z.ZodString;
    fecha: z.ZodString;
    recordatorioMinutos: z.ZodNumber;
    cancelada: z.ZodBoolean;
    modificada: z.ZodBoolean;
    serieId: z.ZodString;
    creadorId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    titulo: string;
    descripcion: string;
    lugar: string;
    creadorId: string;
    fecha: string;
    recordatorioMinutos: number;
    cancelada: boolean;
    modificada: boolean;
    serieId: string;
}, {
    id: string;
    titulo: string;
    descripcion: string;
    lugar: string;
    creadorId: string;
    fecha: string;
    recordatorioMinutos: number;
    cancelada: boolean;
    modificada: boolean;
    serieId: string;
}>;
export declare const SerieEstudioSchema: z.ZodObject<{
    id: z.ZodString;
    titulo: z.ZodString;
    descripcion: z.ZodString;
    lugar: z.ZodString;
    frecuencia: z.ZodEnum<["DIARIA", "SEMANAL", "QUINCENAL"]>;
    fechaInicio: z.ZodString;
    fechaFin: z.ZodString;
    recordatorioMinutos: z.ZodNumber;
    sesiones: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        titulo: z.ZodString;
        descripcion: z.ZodString;
        lugar: z.ZodString;
        fecha: z.ZodString;
        recordatorioMinutos: z.ZodNumber;
        cancelada: z.ZodBoolean;
        modificada: z.ZodBoolean;
        serieId: z.ZodString;
        creadorId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        titulo: string;
        descripcion: string;
        lugar: string;
        creadorId: string;
        fecha: string;
        recordatorioMinutos: number;
        cancelada: boolean;
        modificada: boolean;
        serieId: string;
    }, {
        id: string;
        titulo: string;
        descripcion: string;
        lugar: string;
        creadorId: string;
        fecha: string;
        recordatorioMinutos: number;
        cancelada: boolean;
        modificada: boolean;
        serieId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    titulo: string;
    descripcion: string;
    lugar: string;
    recordatorioMinutos: number;
    frecuencia: "DIARIA" | "SEMANAL" | "QUINCENAL";
    fechaInicio: string;
    fechaFin: string;
    sesiones: {
        id: string;
        titulo: string;
        descripcion: string;
        lugar: string;
        creadorId: string;
        fecha: string;
        recordatorioMinutos: number;
        cancelada: boolean;
        modificada: boolean;
        serieId: string;
    }[];
}, {
    id: string;
    titulo: string;
    descripcion: string;
    lugar: string;
    recordatorioMinutos: number;
    frecuencia: "DIARIA" | "SEMANAL" | "QUINCENAL";
    fechaInicio: string;
    fechaFin: string;
    sesiones: {
        id: string;
        titulo: string;
        descripcion: string;
        lugar: string;
        creadorId: string;
        fecha: string;
        recordatorioMinutos: number;
        cancelada: boolean;
        modificada: boolean;
        serieId: string;
    }[];
}>;
export declare const UsuarioSchema: z.ZodObject<{
    id: z.ZodString;
    nombre: z.ZodString;
    apellido: z.ZodString;
    correo: z.ZodString;
    carrera: z.ZodString;
    semestre: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    carrera: string;
    semestre: number;
}, {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    carrera: string;
    semestre: number;
}>;
export declare const GrupoSchema: z.ZodObject<{
    id: z.ZodString;
    nombre: z.ZodString;
    materiaId: z.ZodOptional<z.ZodString>;
    materia: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        nombre: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        nombre: string;
    }, {
        id: string;
        nombre: string;
    }>>;
    creadorId: z.ZodString;
    administradorId: z.ZodOptional<z.ZodString>;
    cantidadMiembros: z.ZodNumber;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    creadorId: string;
    nombre: string;
    cantidadMiembros: number;
    materiaId?: string | undefined;
    createdAt?: string | undefined;
    materia?: {
        id: string;
        nombre: string;
    } | undefined;
    administradorId?: string | undefined;
}, {
    id: string;
    creadorId: string;
    nombre: string;
    cantidadMiembros: number;
    materiaId?: string | undefined;
    createdAt?: string | undefined;
    materia?: {
        id: string;
        nombre: string;
    } | undefined;
    administradorId?: string | undefined;
}>;
export declare const MensajeSchema: z.ZodObject<{
    id: z.ZodString;
    contenido: z.ZodString;
    remitenteId: z.ZodString;
    remitenteNombre: z.ZodOptional<z.ZodString>;
    destinatarioId: z.ZodOptional<z.ZodString>;
    grupoId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    contenido: string;
    createdAt: string;
    remitenteId: string;
    remitenteNombre?: string | undefined;
    destinatarioId?: string | undefined;
    grupoId?: string | undefined;
}, {
    id: string;
    contenido: string;
    createdAt: string;
    remitenteId: string;
    remitenteNombre?: string | undefined;
    destinatarioId?: string | undefined;
    grupoId?: string | undefined;
}>;
export declare const EncuestaEstadoSchema: z.ZodEnum<["OPEN", "CLOSED"]>;
export declare const EncuestaTargetTypeSchema: z.ZodEnum<["CHAT", "CHANNEL"]>;
export declare const EncuestaTargetSchema: z.ZodObject<{
    type: z.ZodEnum<["CHAT", "CHANNEL"]>;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "CHAT" | "CHANNEL";
}, {
    id: string;
    type: "CHAT" | "CHANNEL";
}>;
export declare const EncuestaOpcionSchema: z.ZodObject<{
    id: z.ZodString;
    pollId: z.ZodString;
    text: z.ZodString;
    position: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    votos: z.ZodOptional<z.ZodNumber>;
    porcentaje: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    pollId: string;
    text: string;
    position: number;
    updatedAt: string;
    votos?: number | undefined;
    porcentaje?: number | undefined;
}, {
    id: string;
    createdAt: string;
    pollId: string;
    text: string;
    position: number;
    updatedAt: string;
    votos?: number | undefined;
    porcentaje?: number | undefined;
}>;
export declare const EncuestaSchema: z.ZodObject<{
    id: z.ZodString;
    question: z.ZodString;
    status: z.ZodEnum<["OPEN", "CLOSED"]>;
    target: z.ZodObject<{
        type: z.ZodEnum<["CHAT", "CHANNEL"]>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "CHAT" | "CHANNEL";
    }, {
        id: string;
        type: "CHAT" | "CHANNEL";
    }>;
    createdById: z.ZodString;
    autoCloseAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    closedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    opciones: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        pollId: z.ZodString;
        text: z.ZodString;
        position: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        votos: z.ZodOptional<z.ZodNumber>;
        porcentaje: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        pollId: string;
        text: string;
        position: number;
        updatedAt: string;
        votos?: number | undefined;
        porcentaje?: number | undefined;
    }, {
        id: string;
        createdAt: string;
        pollId: string;
        text: string;
        position: number;
        updatedAt: string;
        votos?: number | undefined;
        porcentaje?: number | undefined;
    }>, "many">;
    grupoId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    status: "OPEN" | "CLOSED";
    grupoId: string;
    updatedAt: string;
    question: string;
    target: {
        id: string;
        type: "CHAT" | "CHANNEL";
    };
    createdById: string;
    opciones: {
        id: string;
        createdAt: string;
        pollId: string;
        text: string;
        position: number;
        updatedAt: string;
        votos?: number | undefined;
        porcentaje?: number | undefined;
    }[];
    autoCloseAt?: string | null | undefined;
    closedAt?: string | null | undefined;
}, {
    id: string;
    createdAt: string;
    status: "OPEN" | "CLOSED";
    grupoId: string;
    updatedAt: string;
    question: string;
    target: {
        id: string;
        type: "CHAT" | "CHANNEL";
    };
    createdById: string;
    opciones: {
        id: string;
        createdAt: string;
        pollId: string;
        text: string;
        position: number;
        updatedAt: string;
        votos?: number | undefined;
        porcentaje?: number | undefined;
    }[];
    autoCloseAt?: string | null | undefined;
    closedAt?: string | null | undefined;
}>;
export declare const MateriaSchema: z.ZodObject<{
    id: z.ZodString;
    nombre: z.ZodString;
    codigo: z.ZodOptional<z.ZodString>;
    descripcion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    nombre: string;
    descripcion?: string | undefined;
    codigo?: string | undefined;
}, {
    id: string;
    nombre: string;
    descripcion?: string | undefined;
    codigo?: string | undefined;
}>;
export type ForoPregunta = z.infer<typeof ForoPreguntaSchema>;
export type ForoRespuesta = z.infer<typeof ForoRespuestaSchema>;
export type Evento = z.infer<typeof EventoSchema>;
export type SesionEstudio = z.infer<typeof SesionEstudioSchema>;
export type SerieEstudio = z.infer<typeof SerieEstudioSchema>;
export type Usuario = z.infer<typeof UsuarioSchema>;
export type Grupo = z.infer<typeof GrupoSchema>;
export type Mensaje = z.infer<typeof MensajeSchema>;
export type Materia = z.infer<typeof MateriaSchema>;
export type EncuestaEstado = z.infer<typeof EncuestaEstadoSchema>;
export type EncuestaTargetType = z.infer<typeof EncuestaTargetTypeSchema>;
export type EncuestaTarget = z.infer<typeof EncuestaTargetSchema>;
export type EncuestaOpcion = z.infer<typeof EncuestaOpcionSchema>;
export type Encuesta = z.infer<typeof EncuestaSchema>;
//# sourceMappingURL=schemas.d.ts.map