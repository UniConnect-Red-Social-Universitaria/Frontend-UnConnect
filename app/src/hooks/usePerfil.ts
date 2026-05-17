import { useState, useCallback } from "react";
import { perfilService } from "../services/perfil.service";
import { PerfilBaseDTO, PerfilEnriquecido } from "../types/api.types";

interface UsePerfil {
  perfilBase: PerfilBaseDTO | null;
  perfilEnriquecido: PerfilEnriquecido | null;
  cargandoBase: boolean;
  cargandoEnriquecido: boolean;
  expandido: boolean;
  errorBase: string | null;
  errorEnriquecido: string | null;
  cargarPerfilBase: (usuarioId: string) => Promise<void>;
  expandirPerfil: (usuarioId: string) => Promise<void>;
  contraerPerfil: () => void;
}

/**
 * Hook personalizado para manejar la carga del perfil con expansión condicional
 * 
 * Flujo:
 * 1. Carga perfil base automáticamente o bajo demanda
 * 2. Carga perfil enriquecido solo cuando usuario lo solicita (expandir)
 * 3. Maneja errores y estados de carga independientemente
 */
export const usePerfil = (): UsePerfil => {
  const [perfilBase, setPerfilBase] = useState<PerfilBaseDTO | null>(null);
  const [perfilEnriquecido, setPerfilEnriquecido] = useState<PerfilEnriquecido | null>(null);
  const [cargandoBase, setCargandoBase] = useState(false);
  const [cargandoEnriquecido, setCargandoEnriquecido] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [errorBase, setErrorBase] = useState<string | null>(null);
  const [errorEnriquecido, setErrorEnriquecido] = useState<string | null>(null);

  /**
   * Carga el perfil base del usuario
   */
  const cargarPerfilBase = useCallback(async (usuarioId: string) => {
    try {
      setCargandoBase(true);
      setErrorBase(null);
      const perfil = await perfilService.obtenerPerfilBase(usuarioId);
      setPerfilBase(perfil);
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error desconocido";
      setErrorBase(mensaje);
      console.error("Error al cargar perfil base:", error);
    } finally {
      setCargandoBase(false);
    }
  }, []);

  /**
   * Expande el perfil cargando datos enriquecidos (estadísticas + insignias)
   */
  const expandirPerfil = useCallback(async (usuarioId: string) => {
    // Si ya tenemos el perfil enriquecido, solo expandimos
    if (perfilEnriquecido) {
      setExpandido(true);
      return;
    }

    try {
      setCargandoEnriquecido(true);
      setErrorEnriquecido(null);
      const perfilCompleto = await perfilService.obtenerPerfilEnriquecido(
        usuarioId
      );
      setPerfilEnriquecido(perfilCompleto);
      setExpandido(true);
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error desconocido";
      setErrorEnriquecido(mensaje);
      console.error("Error al cargar perfil enriquecido:", error);
    } finally {
      setCargandoEnriquecido(false);
    }
  }, [perfilEnriquecido]);

  /**
   * Contrae el perfil ocultando datos enriquecidos
   */
  const contraerPerfil = useCallback(() => {
    setExpandido(false);
  }, []);

  return {
    perfilBase,
    perfilEnriquecido,
    cargandoBase,
    cargandoEnriquecido,
    expandido,
    errorBase,
    errorEnriquecido,
    cargarPerfilBase,
    expandirPerfil,
    contraerPerfil,
  };
};
