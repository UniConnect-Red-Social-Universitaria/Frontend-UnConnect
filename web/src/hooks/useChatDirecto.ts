import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '../services/auth.service';
import { obtenerHistorialMensajes, enviarNuevoMensaje } from '../services/mensajes.service';

const API_URL = `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3000'}`;

interface UseChatDirectoProps {
	contactoId: string;
	userIdParam?: string | null;
}

export const useChatDirecto = ({ contactoId, userIdParam }: UseChatDirectoProps) => {
	const [mensajes, setMensajes] = useState<any[]>([]);
	const [nuevoMensaje, setNuevoMensaje] = useState('');
	const [userId, setUserId] = useState<string | null>(userIdParam ?? null);
	const [enviando, setEnviando] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const socketRef = useRef<Socket | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

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
					scrollToBottom();
				}

				const token = localStorage.getItem('userToken');
				const platform = 'web';

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
						scrollToBottom();
					}
				};

				const manejarReaccionAgregada = (data: any) => {
					setMensajes((prev) =>
						prev.map((m) => {
							if (m.id === data.mensajeId) {
								const reacciones = m.reacciones || [];
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

				socketRef.current.off('mensaje:nuevo');
				socketRef.current.off('mensaje:enviado');
				socketRef.current.off('mensaje:reaccion:agregada');
				socketRef.current.off('mensaje:reaccion:removida');

				socketRef.current.on('mensaje:nuevo', manejarMensajeSocket);
				socketRef.current.on('mensaje:enviado', manejarMensajeSocket);
				socketRef.current.on('mensaje:reaccion:agregada', manejarReaccionAgregada);
				socketRef.current.on('mensaje:reaccion:removida', manejarReaccionRemovida);
			} catch (err: any) {
				console.error("Error cargando mensajes", err);
			}
		};

		inicializarChat();

		return () => {
			if (socketRef.current) {
				socketRef.current.off("mensaje:reaccion:agregada");
				socketRef.current.off("mensaje:reaccion:removida");
				socketRef.current.disconnect();
			}
		};
	}, [contactoId, userId]);

	const scrollToBottom = () => {
		setTimeout(() => {
			if (scrollRef.current) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		}, 100);
	};

	const handleEnviarMensaje = async () => {
		if (!nuevoMensaje.trim()) return;

		setError(null);
		setEnviando(true);

		try {
			const data = await enviarNuevoMensaje(contactoId, nuevoMensaje.trim());
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

	const handleReaccionar = async (mensajeId: string, emoji: string) => {
		try {
			const mensaje = mensajes.find(m => m.id === mensajeId);
			if (!mensaje) return;
			const yaReacciono = mensaje.reacciones?.some((r: any) => r.emoji === emoji && r.usuarioId === userId);
			
			const { agregarReaccion, removerReaccion } = await import('../services/mensajes.service');
			
			if (yaReacciono) {
				await removerReaccion(mensajeId, emoji, false);
			} else {
				await agregarReaccion(mensajeId, emoji, false);
			}
		} catch (err: any) {
			console.error("Error al reaccionar", err);
		}
	};

	return {
		mensajes,
		nuevoMensaje,
		setNuevoMensaje,
		enviando,
		error,
		userId,
		scrollRef,
		handleEnviarMensaje,
		handleReaccionar,
	};
};
