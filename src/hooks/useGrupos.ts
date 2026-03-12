import { useState, useEffect, useCallback } from "react";
import { gruposService, usuariosService, materiasService, authService } from "../services";
import { showToast } from "../utils/toast";

export type Grupo = {
  id: string;
  nombre: string;
  materia: { id: string; nombre: string };
  creadorId: string;
  cantidadMiembros: number;
  miembros: Array<{ id: string; nombre: string; apellido: string }>;
  createdAt: string;
};

export type GrupoDisponible = Grupo & {
  maxMiembros: number;
  cuposDisponibles: number;
  estaLleno: boolean;
  yaPertenece: boolean;
};

export type Materia = {
  id: string;
  nombre: string;
};

export function useGrupos(navigation: any) {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [gruposDisponibles, setGruposDisponibles] = useState<GrupoDisponible[]>(
    [],
  );
  const [materiasUsuario, setMateriasUsuario] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingGrupoId, setProcessingGrupoId] = useState<string | null>(
    null,
  );

  const cargarMateriasUsuario = useCallback(async () => {
    try {
      const perfil = await usuariosService.getPerfil();
      const todasMaterias = await materiasService.getMaterias();

      const cursando = perfil.materiasCursando || [];
      const filtradas = todasMaterias.filter((m: Materia) =>
        cursando.includes(m.nombre),
      );
      setMateriasUsuario(filtradas);
    } catch (e: any) {
      showToast.error("Error al cargar materias del usuario");
    }
  }, []);

  const cargarGrupos = useCallback(async () => {
    try {
      const gruposData = await gruposService.getGrupos();
      // Aquí asumimos que el backend devuelve la lista de grupos
      // y dentro se indica cuáles son disponibles con flags
      setGrupos(gruposData as any);
      // Aquí podrías filtrar los disponibles si es necesario
      setGruposDisponibles(gruposData as any);
      setError(null);
    } catch (err: any) {
      if (err.message.includes('401')) {
        await authService.logout();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }
      setError(err.message || "Error al cargar grupos");
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  const unirseAGrupo = useCallback(
    async (grupoId: string) => {
      setProcessingGrupoId(grupoId);
      try {
        await gruposService.unirseAGrupo(grupoId);
        setError(null);
        await cargarGrupos();
      } catch (err: any) {
        setError(err.message || "Error al unirse al grupo");
      } finally {
        setProcessingGrupoId(null);
      }
    },
    [cargarGrupos],
  );

  useEffect(() => {
    let isMounted = true;
    const inicializar = async () => {
      const isAuth = await authService.isAuthenticated();
      if (isMounted && isAuth) {
        await Promise.all([
          cargarGrupos(),
          cargarMateriasUsuario(),
        ]);
      } else if (isMounted) {
        setError("No hay sesión activa. Inicia sesión para ver tus grupos.");
        setLoading(false);
      }
    };
    inicializar();
    return () => {
      isMounted = false;
    };
  }, [cargarGrupos, cargarMateriasUsuario]);

  return {
    grupos,
    gruposDisponibles,
    materiasUsuario,
    loading,
    error,
    processingGrupoId,
    unirseAGrupo,
    cargarGrupos,
  };
}
