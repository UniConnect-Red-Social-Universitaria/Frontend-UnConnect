import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
// @ts-expect-error - La biblioteca no tiene tipos, pero funciona correctamente
import type { Encuesta } from '@uniconnect/api-types';
import { authService } from '../services/auth.service';
import { obtenerHistorialMensajesGrupo, enviarNuevoMensajeGrupo } from '../services/mensajes.service';
import { encuestasService } from '../services/encuestas.service';

const API_URL = `${import.meta.env?.VITE_API_URL || 'http://localhost:3000'}`;

interface UseChatGrupoProps {
	grupoId: string;
	userIdParam?: string | null;
}

export const useChatGrupo = ({ grupoId, userIdParam }: UseChatGrupoProps) => {
	const [mensajes, setMensajes] = useState<any[]>([]);
	const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
	const [nuevoMensaje, setNuevoMensaje] = useState('');
	const [userId, setUserId] = useState<string | null>(userIdParam ?? null);
	const [enviando, setEnviando] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [votandoEncuestaId, setVotandoEncuestaId] = useState<string | null>(null);

	const socketRef = useRef<Socket | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = useCallback(() => {
		setTimeout(() => {
			if (scrollRef.current) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		}, 100);
	}, []);

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

				scrollToBottom();

				const token = localStorage.getItem('userToken');
				const platform = 'web';

				const manejarMensajeSocket = (msg: any) => {
					if (msg.grupoId === grupoId) {
						setMensajes((prev) => {
							if (prev.some((m) => m.id === msg.id)) return prev;
							return [...prev, msg];
						});
						scrollToBottom();
					}
				};

				const manejarEncuestaSocket = (encuesta: Encuesta) => {
					if (encuesta.grupoId !== grupoId) return;

					upsertEncuestaLocal(encuesta);
					scrollToBottom();
				};

				const manejarReaccionAgregada = (data: any) => {
					setMensajes((prev) =>
						prev.map((m) => {
							if (m.id === data.mensajeId) {
								const reacciones = m.reacciones || [];
								// Evitar duplicados
								const existe = reacciones.some((r: any) => r.usuarioId === data.usuarioId && r.emoji === data.emoji);
								if (existe) return m;
								return { ...m, reacciones: [...reacciones, data] };
							}
							return m;
						})
					);
				};

				const manejarReaccionRemovida = (data: any) => {
					setMensajes((prev) =>
						prev.map((m) => {
							if (m.id === data.mensajeId) {
								const reacciones = (m.reacciones || []).filter(
									(r: any) => !(r.emoji === data.emoji && r.usuarioId === data.usuarioId)
								);
								return { ...m, reacciones };
							}
							return m;
						})
					);
				};

				if (!socketRef.current) {
					socketRef.current = io(API_URL, {
						auth: { token, platform },
						transports: ['websocket'],
						reconnection: true,
						reconnectionDelay: 1000,
						reconnectionDelayMax: 5000,
						reconnectionAttempts: Infinity,
					});
				} else {
					socketRef.current.auth = { token, platform };
					if (!socketRef.current.connected) {
						socketRef.current.connect();
					}
				}

				// Limpiar listeners anteriores para evitar duplicados
				socketRef.current.off('connect');
				socketRef.current.off('grupo:mensaje:nuevo');
				socketRef.current.off('encuesta:nueva');
				socketRef.current.off('encuesta:actualizada');
				socketRef.current.off('grupo:reaccion:agregada');
				socketRef.current.off('grupo:reaccion:removida');

				const suscribir = () => {
					console.log(`[Chat Grupo] Suscribiendo al grupo ${grupoId}`);
					socketRef.current?.emit('grupo:suscribir', grupoId);
				};

				if (socketRef.current.connected) {
					suscribir();
				}

				socketRef.current.on('connect', suscribir);
				socketRef.current.on('grupo:mensaje:nuevo', manejarMensajeSocket);
				socketRef.current.on('encuesta:nueva', manejarEncuestaSocket);
				socketRef.current.on('encuesta:actualizada', manejarEncuestaSocket);
				socketRef.current.on('grupo:reaccion:agregada', manejarReaccionAgregada);
				socketRef.current.on('grupo:reaccion:removida', manejarReaccionRemovida);
			} catch (err: any) {
				console.error("Error cargando mensajes del grupo", err);
			}
		};

		inicializarChat();

		return () => {
			if (socketRef.current) {
				socketRef.current.emit('grupo:desuscribir', grupoId);
				socketRef.current.off('grupo:mensaje:nuevo');
				socketRef.current.off('encuesta:nueva');
				socketRef.current.off('encuesta:actualizada');
				socketRef.current.off('grupo:reaccion:agregada');
				socketRef.current.off('grupo:reaccion:removida');
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
				scrollToBottom();
			} else {
				setError(data.message || 'Error al votar');
			}
		} catch (err: any) {
			setError(err.message || 'Error de red');
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
			scrollToBottom();
			return data.data;
		}

		throw new Error(data.message || 'Error al crear la encuesta');
	};



	const handleEnviarMensaje = async () => {
		if (!nuevoMensaje.trim()) return;

		setError(null);
		setEnviando(true);

		try {
			const data = await enviarNuevoMensajeGrupo(grupoId, nuevoMensaje.trim());
			if (data.success && data.data) {
				setMensajes((prev) => {
					if (prev.some((m) => m.id === data.data.id)) return prev;
					return [...prev, data.data];
				});
				setNuevoMensaje('');
				scrollToBottom();
			} else {
				setError(data.message || 'Error al enviar');
			}
		} catch (err: any) {
			setError(err.message || 'Error de red');
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

	const handleReaccionar = async (mensajeId: string, emoji: string) => {
		try {
			const mensaje = mensajes.find(m => m.id === mensajeId);
			if (!mensaje) return;
			const yaReacciono = mensaje.reacciones?.some((r: any) => r.emoji === emoji && r.usuarioId === userId);
			
			const { agregarReaccion, removerReaccion } = await import('../services/mensajes.service');
			
			if (yaReacciono) {
				await removerReaccion(mensajeId, emoji, true);
			} else {
				await agregarReaccion(mensajeId, emoji, true);
			}
		} catch (err: any) {
			console.error("Error al reaccionar", err);
		}
	};

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
		scrollRef,
		handleEnviarMensaje,
		handleVotarEncuesta,
		handleCrearEncuesta,
		handleReaccionar,
	};
};
