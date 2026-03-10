import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { resolverApiBaseUrl } from "../utils/apiConfig";

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

const REQUEST_TIMEOUT_MS = 10000;
const AUTH_TOKEN_STORAGE_KEY = "userToken";

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

  const apiBaseUrl = resolverApiBaseUrl();

  const cargarMateriasUsuario = useCallback(
    async (jwt: string) => {
      try {
        const [perfilRes, materiasRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/usuarios/perfil`, {
            headers: { Authorization: `Bearer ${jwt}` },
          }),
          fetch(`${apiBaseUrl}/api/materias`, {
            headers: { Authorization: `Bearer ${jwt}` },
          }),
        ]);

        const [perfilData, materiasData] = await Promise.all([
          perfilRes.json().catch(() => ({ success: false })),
          materiasRes.json().catch(() => ({ success: false })),
        ]);

        if (perfilData.success && materiasData.success) {
          const cursando = perfilData.data.materiasCursando || [];
          const catalogoTodasMaterias = materiasData.data || [];
          const filtradas = catalogoTodasMaterias.filter((m: Materia) =>
            cursando.includes(m.nombre),
          );
          setMateriasUsuario(filtradas);
        }
      } catch (e) {
        console.log("Error al cargar materias del usuario", e);
      }
    },
    [apiBaseUrl],
  );

  const cargarGrupos = useCallback(
    async (jwt: string) => {
      if (!apiBaseUrl.trim()) {
        setError("No se pudo resolver la URL del backend.");
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      try {
        const [misGruposResponse, disponiblesResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/grupos`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${jwt}` },
          }),
          fetch(`${apiBaseUrl}/api/grupos/disponibles`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${jwt}` },
          }),
        ]);

        const [misGruposPayload, disponiblesPayload] = await Promise.all([
          misGruposResponse.json().catch(() => ({ success: false })),
          disponiblesResponse.json().catch(() => ({ success: false })),
        ]);

        if (
          misGruposResponse.status === 401 ||
          disponiblesResponse.status === 401
        ) {
          await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          return;
        }

        setGrupos(
          misGruposResponse.ok && misGruposPayload.success
            ? (misGruposPayload.data ?? [])
            : [],
        );
        setGruposDisponibles(
          disponiblesResponse.ok && disponiblesPayload.success
            ? (disponiblesPayload.data ?? [])
            : [],
        );
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error && err.name === "AbortError"
            ? "Tiempo de espera agotado"
            : "Error desconocido",
        );
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [apiBaseUrl, navigation],
  );

  const unirseAGrupo = useCallback(
    async (grupoId: string) => {
      setProcessingGrupoId(grupoId);
      try {
        const tokenGuardado = await AsyncStorage.getItem(
          AUTH_TOKEN_STORAGE_KEY,
        );
        if (!tokenGuardado) return setError("No hay sesión activa.");

        const response = await fetch(
          `${apiBaseUrl}/api/grupos/${grupoId}/unirse`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenGuardado.trim()}`,
              "Content-Type": "application/json",
            },
          },
        );

        const payload = await response.json().catch(() => ({ success: false }));
        if (!response.ok || !payload.success) {
          setError(
            payload.message ?? "No se pudo completar la unión al grupo.",
          );
          return;
        }

        setError(null);
        await cargarGrupos(tokenGuardado.trim());
      } catch (err) {
        setError("Error al unirse al grupo");
      } finally {
        setProcessingGrupoId(null);
      }
    },
    [apiBaseUrl, cargarGrupos],
  );

  useEffect(() => {
    let isMounted = true;
    const inicializar = async () => {
      const tokenGuardado = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (isMounted && tokenGuardado && tokenGuardado !== "null") {
        await Promise.all([
          cargarGrupos(tokenGuardado.trim()),
          cargarMateriasUsuario(tokenGuardado.trim()),
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
