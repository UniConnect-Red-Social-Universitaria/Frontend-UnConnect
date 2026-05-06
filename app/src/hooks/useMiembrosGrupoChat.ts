import { useState, useCallback } from 'react';
import { gruposService } from '../services';
import { showToast } from '../utils/toast';

export interface Miembro {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  foto?: string;
  esAdministrador?: boolean;
}

export function useMiembrosGrupoChat(grupoId: string) {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarMiembros = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await gruposService.getMiembros(grupoId);
      setMiembros(datos);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar miembros';
      setError(mensaje);
      showToast.error(mensaje);
    } finally {
      setCargando(false);
    }
  }, [grupoId]);

  return { miembros, cargando, error, cargarMiembros };
}
