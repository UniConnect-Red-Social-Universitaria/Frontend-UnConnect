import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '../services/auth.service';
import { obtenerHistorialMensajesGrupo, enviarNuevoMensajeGrupo } from '../services/mensajes.service';

const API_URL = `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3000'}`;

interface UseChatGrupoProps {
	grupoId: string;
	userIdParam?: string | null;
}

export const useChatGrupo = ({ grupoId, userIdParam }: UseChatGrupoProps) => {
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
				const data = await obtenerHistorialMensajesGrupo(grupoId);
				if (data.success && Array.isArray(data.data)) {
					setMensajes(data.data);
					scrollToBottom();
				}

				const token = localStorage.getItem('userToken');
				const platform = 'web';

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
					socketRef.current.connect();
				}

				socketRef.current.off('grupo:mensaje:nuevo');

				socketRef.current.on('connect', () => {
					socketRef.current?.emit('grupo:suscribir', grupoId);
				});

				const manejarMensajeSocket = (msg: any) => {
					if (msg.grupoId === grupoId) {
						setMensajes((prev) => {
							if (prev.some((m) => m.id === msg.id)) return prev;
							return [...prev, msg];
						});
						scrollToBottom();
					}
				};

				socketRef.current.on('grupo:mensaje:nuevo', manejarMensajeSocket);
			} catch (err: any) {
				console.error("Error cargando mensajes del grupo", err);
			}
		};

		inicializarChat();

		return () => {
			if (socketRef.current) {
				socketRef.current.emit('grupo:desuscribir', grupoId);
				socketRef.current.disconnect();
			}
		};
	}, [grupoId, userId]);

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

	return {
		mensajes,
		nuevoMensaje,
		setNuevoMensaje,
		enviando,
		error,
		userId,
		scrollRef,
		handleEnviarMensaje,
	};
};
