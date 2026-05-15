import { useState, useEffect, useRef, useMemo } from "react";
import { FlatList, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import type { Encuesta } from "@uniconnect/api-types";

import { resolverApiBaseUrl } from "../utils/apiConfig";
import { showToast } from "../utils/toast";
import {
  obtenerHistorialMensajesGrupo,
  enviarNuevoMensajeGrupo,
} from "../services/mensajes.service";
import { encuestasService } from "../services/encuestas.service";
import { authService } from "../services";

interface UseChatGrupoProps {
  grupoId: string;
  userIdParam?: string | null;
}

export const useChatGrupo = ({ grupoId, userIdParam }: UseChatGrupoProps) => {
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [userId, setUserId] = useState<string | null>(userIdParam ?? null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votandoEncuestaId, setVotandoEncuestaId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<any>>(null);
  const socketRef = useRef<any>(null);

  const upsertEncuestaLocal = (encuesta: Encuesta) => {
    setEncuestas((prev) => {
      const index = prev.findIndex((item) => item.id === encuesta.id);
      if (index === -1) return [...prev, encuesta];
      return prev.map((item, currentIndex) => (currentIndex === index ? encuesta : item));
    });
  };

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
        const [resultMsg, resultEncuestas] = await Promise.allSettled([
          obtenerHistorialMensajesGrupo(grupoId),
          encuestasService.obtenerEncuestasDeGrupo(grupoId),
        ]);

        if (resultMsg.status === 'fulfilled' && resultMsg.value.success && Array.isArray(resultMsg.value.data)) {
          setMensajes(resultMsg.value.data);
        }

        if (resultEncuestas.status === 'fulfilled' && resultEncuestas.value.success && Array.isArray(resultEncuestas.value.data)) {
          setEncuestas(resultEncuestas.value.data);
        } else if (resultEncuestas.status === 'rejected') {
          console.warn('[Chat Grupo] No se pudieron cargar las encuestas:', resultEncuestas.reason);
        }

        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: false }),
          100,
        );

        const token = await AsyncStorage.getItem("userToken");

        // Detectar plataforma: 'web' si Platform.OS es 'web', 'mobile' si es 'android' o 'ios'
        const platform = Platform.OS === 'web' ? 'web' : 'mobile';

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

        const manejarEncuestaSocket = (encuesta: Encuesta) => {
          if (encuesta.grupoId !== grupoId) {
            return;
          }

          upsertEncuestaLocal(encuesta);
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            50,
          );
        };

        if (!socketRef.current) {
          socketRef.current = io(resolverApiBaseUrl(), {
            auth: { token, platform },
            transports: ["websocket"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
          });
        } else {
          socketRef.current.auth = { token, platform };
          socketRef.current.connect();
        }

        // Escuchar conexión establecida para emitir suscripción
        socketRef.current.on("connect", () => {
          console.log(`[Chat Grupo] Socket conectado (${platform})`);
          // Emitir evento de suscripción al grupo
          socketRef.current.emit("grupo:suscribir", grupoId, (ack: any) => {
            console.log(`[Chat Grupo] Suscripción confirmada para ${grupoId}:`, ack);
          });
        });

        socketRef.current.on("grupo:mensaje:nuevo", manejarMensajeSocket);
        socketRef.current.on("encuesta:nueva", manejarEncuestaSocket);
        socketRef.current.on("encuesta:actualizada", manejarEncuestaSocket);

        // Log para debugging
        socketRef.current.on("disconnect", () => {
          console.log(`[Chat Grupo] Socket desconectado`);
        });

        socketRef.current.on("connect_error", (error: any) => {
          console.error(`[Chat Grupo] Error de conexión:`, error);
        });

      } catch (error: any) {
        showToast.error(
          error.message || "Error cargando los mensajes del grupo",
        );
      }
    };

    inicializarChat();

    return () => {
      if (socketRef.current) {
        // Emitir desuscripción antes de desconectar
        socketRef.current.emit("grupo:desuscribir", grupoId, () => {
          console.log(`[Chat Grupo] Desuscripción enviada para ${grupoId}`);
        });
        socketRef.current.off("grupo:mensaje:nuevo");
        socketRef.current.off("encuesta:nueva");
        socketRef.current.off("encuesta:actualizada");
        socketRef.current.disconnect();
      }
    };
  }, [grupoId, userId]);

  const handleVotarEncuesta = async (encuestaId: string, optionId: string) => {
    if (votandoEncuestaId === encuestaId) return;

    setError(null);
    setVotandoEncuestaId(encuestaId);

    try {
      const data = await encuestasService.votarEnEncuesta(encuestaId, optionId);

      if (data.success && data.data) {
        upsertEncuestaLocal(data.data);
      } else {
        setError(data.message || "Error al votar en la encuesta");
      }
    } catch (err: any) {
      setError(err.message || "Error de red");
    } finally {
      setVotandoEncuestaId(null);
    }
  };

  const handleCrearEncuesta = async (payload: {
    question: string;
    options: string[];
    autoCloseAt: string | null;
  }) => {
    const data = await encuestasService.crearEncuestaEnGrupo(grupoId, {
      pregunta: payload.question,
      opciones: payload.options,
      autoCloseAt: payload.autoCloseAt,
    });

    if (data.success && data.data) {
      upsertEncuestaLocal(data.data);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        50,
      );
      return data.data;
    }

    throw new Error(data.message || "Error al crear la encuesta");
  };

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

  // Combina mensajes y encuestas en una sola lista ordenada por createdAt
  const items = useMemo(() => {
    const mensajesTagged = mensajes.map((m: any) => ({ ...m, _type: 'mensaje' as const }));
    const encuestasTagged = encuestas.map((e) => ({ ...e, _type: 'encuesta' as const }));
    return [...mensajesTagged, ...encuestasTagged].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [mensajes, encuestas]);

  return {
    items,
    mensajes,
    encuestas,
    nuevoMensaje,
    setNuevoMensaje,
    enviando,
    error,
    userId,
    votandoEncuestaId,
    flatListRef,
    handleEnviarMensaje,
    handleVotarEncuesta,
    handleCrearEncuesta,
  };
};
