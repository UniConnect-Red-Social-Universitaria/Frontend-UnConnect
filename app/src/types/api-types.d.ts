declare module '@uniconnect/api-types' {
    export type {
        ForoPregunta,
        ForoRespuesta,
        Evento,
        SesionEstudio,
        SerieEstudio,
        Usuario,
        Grupo,
        Mensaje,
        Materia,
        EncuestaEstado,
        EncuestaTargetType,
        EncuestaTarget,
        EncuestaOpcion,
        Encuesta,
    } from '../../../packages/api-types/src/schemas';
    export type { paths, components, operations } from '../../../packages/api-types/src/schema';
}