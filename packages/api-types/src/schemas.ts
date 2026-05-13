import { z } from 'zod';

export const ForoPreguntaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  contenido: z.string(),
  autorId: z.string(),
  autorNombre: z.string(),
  materiaId: z.string(),
  createdAt: z.string().datetime(),
});

export const ForoRespuestaSchema = z.object({
  id: z.string(),
  contenido: z.string(),
  autorId: z.string(),
  autorNombre: z.string(),
  preguntaId: z.string(),
  puntuacion: z.number().int(),
  createdAt: z.string().datetime(),
});

export const EventoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  lugar: z.string().optional(),
  fechaEvento: z.string().datetime(),
  categoria: z.enum(['academico', 'cultural', 'deportivo', 'otro']),
  creadorId: z.string(),
});

export const SesionEstudioSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  lugar: z.string(),
  fecha: z.string().datetime(),
  recordatorioMinutos: z.number().int().positive(),
  cancelada: z.boolean(),
  modificada: z.boolean(),
  serieId: z.string(),
  creadorId: z.string(),
});

export const SerieEstudioSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  lugar: z.string(),
  frecuencia: z.enum(['DIARIA', 'SEMANAL', 'QUINCENAL']),
  fechaInicio: z.string().datetime(),
  fechaFin: z.string().datetime(),
  recordatorioMinutos: z.number().int().positive(),
  sesiones: z.array(SesionEstudioSchema),
});

export const UsuarioSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  correo: z.string().email(),
  carrera: z.string(),
  semestre: z.number().int(),
});

export const GrupoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  materiaId: z.string().optional(),
  materia: z.object({ id: z.string(), nombre: z.string() }).optional(),
  creadorId: z.string(),
  administradorId: z.string().optional(),
  cantidadMiembros: z.number().int().nonnegative(),
  createdAt: z.string().datetime().optional(),
});

export const MensajeSchema = z.object({
  id: z.string(),
  contenido: z.string(),
  remitenteId: z.string(),
  remitenteNombre: z.string().optional(),
  destinatarioId: z.string().optional(),
  grupoId: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const MateriaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  codigo: z.string().optional(),
  descripcion: z.string().optional(),
});

// Tipos inferidos de Zod (única fuente de verdad en runtime)
export type ForoPregunta = z.infer<typeof ForoPreguntaSchema>;
export type ForoRespuesta = z.infer<typeof ForoRespuestaSchema>;
export type Evento = z.infer<typeof EventoSchema>;
export type SesionEstudio = z.infer<typeof SesionEstudioSchema>;
export type SerieEstudio = z.infer<typeof SerieEstudioSchema>;
export type Usuario = z.infer<typeof UsuarioSchema>;
export type Grupo = z.infer<typeof GrupoSchema>;
export type Mensaje = z.infer<typeof MensajeSchema>;
export type Materia = z.infer<typeof MateriaSchema>;
