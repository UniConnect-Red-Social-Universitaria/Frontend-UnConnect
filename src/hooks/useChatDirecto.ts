import { useState, useEffect, useRef } from "react";
import { FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";

import { resolverApiBaseUrl } from "../utils/apiConfig";
import { showToast } from "../utils/toast";
import {
  obtenerHistorialMensajes,
  enviarNuevoMensaje,
} from "../services/mensajes.service";
import { authService } from "../services";

interface UseChatDirectoProps {
  contactoId: string;
  userIdParam?: string | null;
}

export const useChatDirecto = ({
  contactoId,
  userIdParam,
}: UseChatDirectoProps) => {
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
        const data = await obtenerHistorialMensajes(contactoId);
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

        socketRef.current.off("mensaje:nuevo");
        socketRef.current.off("mensaje:enviado");

        const manejarMensajeSocket = (msg: any) => {
          const esMensajeRelevante =
            (msg.emisorId === userId && msg.receptorId === contactoId) ||
            (msg.emisorId === contactoId && msg.receptorId === userId);

          if (esMensajeRelevante) {
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

        socketRef.current.on("mensaje:nuevo", manejarMensajeSocket);
        socketRef.current.on("mensaje:enviado", manejarMensajeSocket);
      } catch (error: any) {
        showToast.error(error.message || "Error cargando los mensajes");
      }
    };

    inicializarChat();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [contactoId, userId]);

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    setError(null);
    setEnviando(true);

    try {
      const data = await enviarNuevoMensaje(contactoId, nuevoMensaje.trim());

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
        setError(data.message || "Error al enviar");
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
