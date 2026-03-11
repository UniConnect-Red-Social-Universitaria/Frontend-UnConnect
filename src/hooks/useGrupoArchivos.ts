import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { resolverApiBaseUrl } from "../utils/apiConfig";
import { Platform, Alert } from "react-native";

const AUTH_TOKEN_STORAGE_KEY = "userToken";

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

  const apiBaseUrl = resolverApiBaseUrl();

  const cargarArchivos = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const res = await fetch(`${apiBaseUrl}/api/grupos/${grupoId}/archivos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setArchivos(data.data);
      }
    } catch (error) {
      console.log("Error al cargar archivos", error);
    } finally {
      setLoading(false);
    }
  }, [grupoId, apiBaseUrl]);

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
        Alert.alert("Error", "El archivo excede el límite de 10MB");
        return;
      }

      setUploading(true);
      const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

      const formData = new FormData();
      if (Platform.OS === "web" && file.file) {
        formData.append("archivo", file.file as any);
      } else {
        formData.append("archivo", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/pdf",
        } as any);
      }

      const response = await fetch(
        `${apiBaseUrl}/api/grupos/${grupoId}/archivos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const payload = await response.json();

      if (response.ok && payload.success) {
        Alert.alert("Éxito", "PDF subido correctamente");
        cargarArchivos();
      } else {
        Alert.alert("Error", payload.message || "No se pudo subir el archivo");
      }
    } catch (error) {
      console.log("Error subiendo PDF", error);
      Alert.alert("Error", "Ocurrió un error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const descargarPdf = async (archivoId: string, nombreArchivo: string) => {
    setDownloadingId(archivoId);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const url = `${apiBaseUrl}/api/grupos/${grupoId}/archivos/${archivoId}/descargar`;

      const fileUri = `${FileSystem.documentDirectory}${nombreArchivo}`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert("Error", "No se pudo descargar el archivo");
      }
    } catch (error) {
      console.log("Error descargando", error);
      Alert.alert("Error", "Ocurrió un error al intentar descargar");
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
