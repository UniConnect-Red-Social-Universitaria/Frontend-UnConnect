import { useState, useEffect, useRef } from "react";
import { FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";

import { resolverApiBaseUrl } from "../utils/apiConfig";
import { showToast } from "../utils/toast";
import {
  obtenerHistorialMensajesGrupo,
  enviarNuevoMensajeGrupo,
} from "../services/mensajes.service";
import { authService } from "../services";

interface UseChatGrupoProps {
  grupoId: string;
  userIdParam?: string | null;
}

export const useChatGrupo = ({ grupoId, userIdParam }: UseChatGrupoProps) => {
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [userId, setUserId] = useState<string | null>(userIdParam ?? null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<any>>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!userIdParam) {
      authService.obtenerIdUsuarioActual().then((id) => {
        if (id) setUserId(id);
      });
    }
  }, [userIdParam]);

  useEffect(() => {
    if (!userId) return;

    const inicializarChat = async () => {
      try {
        const data = await obtenerHistorialMensajesGrupo(grupoId);
        if (data.success && Array.isArray(data.data)) {
          setMensajes(data.data);
        }

        const token = await AsyncStorage.getItem("userToken");
        if (!socketRef.current) {
          socketRef.current = io(resolverApiBaseUrl(), {
            auth: { token },
            transports: ["websocket"],
          });
        } else {
          socketRef.current.auth = { token };
          socketRef.current.connect();
        }
        socketRef.current.off("grupo:mensaje:nuevo");

        const manejarMensajeSocket = (msg: any) => {
          if (msg.grupoId === grupoId) {
            setMensajes((prev) => {
              const mensajeYaExiste = prev.some((m) => m.id === msg.id);
              if (mensajeYaExiste) return prev;
              return [...prev, msg];
            });
            setTimeout(
              () => flatListRef.current?.scrollToEnd({ animated: true }),
              50,
            );
          }
        };

        socketRef.current.on("grupo:mensaje:nuevo", manejarMensajeSocket);
      } catch (error: any) {
        showToast.error(
          error.message || "Error cargando los mensajes del grupo",
        );
      }
    };

    inicializarChat();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [grupoId, userId]);

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    setError(null);
    setEnviando(true);

    try {
      const data = await enviarNuevoMensajeGrupo(grupoId, nuevoMensaje.trim());

      if (data.success && data.data) {
        setMensajes((prev) => {
          const mensajeYaExiste = prev.some((m) => m.id === data.data.id);
          if (mensajeYaExiste) return prev;
          return [...prev, data.data];
        });

        setNuevoMensaje("");
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100,
        );
      } else {
        setError(data.message || "Error al enviar al grupo");
      }
    } catch (err: any) {
      setError(err.message || "Error de red");
    } finally {
      setEnviando(false);
    }
  };

  return {
    mensajes,
    nuevoMensaje,
    setNuevoMensaje,
    enviando,
    error,
    userId,
    flatListRef,
    handleEnviarMensaje,
  };
};
