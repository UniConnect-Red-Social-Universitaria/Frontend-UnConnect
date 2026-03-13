import { useState, useEffect, useCallback } from "react";
import { gruposService, usuariosService } from "../services";
import { showToast } from "../utils/toast";

export function useMiembrosGrupo(
  grupoId: string,
  creadorId: string,
  materiaNombre: string,
  miembrosInicialesIds: string[],
) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [miembrosActualesIds, setMiembrosActualesIds] = useState<string[]>(
    miembrosInicialesIds || [],
  );

  useEffect(() => {
    const verificarRolAdministrador = async () => {
      try {
        const perfil = await usuariosService.getPerfil();
        if (perfil.id === creadorId) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.log("Error verificando rol", error);
      }
    };
    verificarRolAdministrador();
  }, [creadorId]);

  const cargarCandidatos = useCallback(async () => {
    setCargandoCandidatos(true);
    try {
      const usuariosDeMateria =
        await usuariosService.buscarPorMateria(materiaNombre);
      const usuariosDisponibles = usuariosDeMateria.filter(
        (usuario: any) => !miembrosActualesIds.includes(usuario.id),
      );
      setCandidatos(usuariosDisponibles);
    } catch (error) {
      console.log("Error cargando candidatos:", error);
      showToast.error("No se pudieron cargar los compañeros");
    } finally {
      setCargandoCandidatos(false);
    }
  }, [materiaNombre, miembrosActualesIds]);

  const agregarMiembro = async (
    usuarioSeleccionadoId: string,
    onSuccess: () => void,
  ) => {
    setAgregando(true);
    try {
      await gruposService.agregarMiembro(grupoId, usuarioSeleccionadoId);
      showToast.success("Miembro agregado correctamente");
      setMiembrosActualesIds((prev) => [...prev, usuarioSeleccionadoId]);
      onSuccess();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Error al agregar miembro";
      showToast.error(errorMsg);
    } finally {
      setAgregando(false);
    }
  };

  return {
    isAdmin,
    candidatos,
    cargandoCandidatos,
    agregando,
    cargarCandidatos,
    agregarMiembro,
  };
}
