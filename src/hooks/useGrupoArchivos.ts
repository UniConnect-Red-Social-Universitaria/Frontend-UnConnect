import { useState, useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { archivosService } from "../services";
import { showToast } from "../utils/toast";

export type ArchivoGrupo = {
  id: string;
  nombre: string;
  mimeType: string;
  tamanoBytes: number;
  grupoId: string;
  subidoPor?: { id: string; nombre: string; apellido: string };
  createdAt: string;
  descargarUrl: string;
};

export function useGrupoArchivos(grupoId: string) {
  const [archivos, setArchivos] = useState<ArchivoGrupo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const cargarArchivos = useCallback(async () => {
    setLoading(true);
    try {
      const archivosData = await archivosService.getArchivosPorGrupo(grupoId);
      setArchivos(archivosData as any);
    } catch (error: any) {
      showToast.error("Error al cargar archivos");
    } finally {
      setLoading(false);
    }
  }, [grupoId]);

  const subirPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0)
        return;

      const file = result.assets[0];

      if (file.size && file.size > 10 * 1024 * 1024) {
        showToast.error("El archivo excede el límite de 10MB");
        return;
      }

      setUploading(true);

      const fileData = Platform.OS === "web" && file.file
        ? { uri: "", name: file.name, type: file.mimeType || "application/pdf", file: file.file }
        : { uri: file.uri, name: file.name, type: file.mimeType || "application/pdf" };

      await archivosService.subirArchivo(grupoId, fileData as any);

      showToast.success("PDF subido correctamente");
      cargarArchivos();
    } catch (error: any) {
      showToast.error(error.message || "Ocurrió un error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const descargarPdf = async (archivoId: string, nombreArchivo: string) => {
    setDownloadingId(archivoId);
    try {
      const url = await archivosService.descargarArchivo(archivoId);
      const fileUri = `${FileSystem.documentDirectory}${nombreArchivo}`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        showToast.error("No se pudo descargar el archivo");
      }
    } catch (error) {
      showToast.error("Ocurrió un error al intentar descargar");
    } finally {
      setDownloadingId(null);
    }
  };

  return {
    archivos,
    loading,
    uploading,
    downloadingId,
    cargarArchivos,
    subirPdf,
    descargarPdf,
  };
}
