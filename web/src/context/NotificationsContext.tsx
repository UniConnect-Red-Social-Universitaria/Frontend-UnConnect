import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
	incrementUnreadNotificationsCount,
	subscribeUnreadNotificationsCount,
} from '../services/notificaciones-badge.service';
import { upsertUnreadDirectChatNotification } from '../services/notificaciones-chat.service';
import { upsertUnreadGroupChatNotification } from '../services/notificaciones-chat.service';
import { upsertUnreadContactRequestNotification } from '../services/notificaciones-solicitudes.service';
import { upsertUnreadRejectedRequestNotification } from '../services/notificaciones-rechazos.service';
import { upsertUnreadGroupEventNotification } from '../services/notificaciones-grupo.service';
import { publishContactRequestRejected } from '../services/contacto-events.service';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface NotificationsContextValue {
	unreadCount: number;
	/** ID de la ruta activa para filtrar notificaciones duplicadas */
	setActiveChat: (params: { type: 'direct' | 'group'; id: string } | null) => void;
	/** Toast visual — se muestra desde cualquier pantalla */
	toasts: ToastItem[];
	dismissToast: (id: string) => void;
}

export interface ToastItem {
	id: string;
	message: string;
	type: 'info' | 'success' | 'error';
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, userId } = useAuth();
	const socketRef = useRef<Socket | null>(null);
	const activeChatRef = useRef<{ type: 'direct' | 'group'; id: string } | null>(null);
	const [unreadCount, setUnreadCount] = useState(0);
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	// Suscribirse al badge counter
	useEffect(() => {
		const unsubscribe = subscribeUnreadNotificationsCount(setUnreadCount);
		return unsubscribe;
	}, []);

	const addToast = (message: string, type: ToastItem['type'] = 'info') => {
		const id = `${Date.now()}-${Math.random()}`;
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	};

	const dismissToast = (id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	const setActiveChat = (params: { type: 'direct' | 'group'; id: string } | null) => {
		activeChatRef.current = params;
	};

	// Socket de notificaciones global
	useEffect(() => {
		if (!isAuthenticated || !userId) {
			socketRef.current?.disconnect();
			socketRef.current = null;
			return;
		}

		const token = localStorage.getItem('userToken');
		if (!token) return;

		// Evitar duplicar socket si ya existe con el mismo token
		if (socketRef.current?.connected) return;

		const socket = io(API_URL, {
			auth: { token },
			transports: ['websocket'],
			forceNew: true,
			reconnection: true,
			reconnectionAttempts: Infinity,
		});

		socketRef.current = socket;

		socket.on('mensaje:nuevo', async (msg: any) => {
			if (msg?.emisorId === userId) return;

			const active = activeChatRef.current;
			if (active?.type === 'direct' && active.id === msg?.emisorId) return;

			const emisorNombre = [msg?.emisor?.nombre, msg?.emisor?.apellido]
				.filter(Boolean)
				.join(' ')
				.trim();

			await upsertUnreadDirectChatNotification({
				contactoId: String(msg?.emisorId ?? ''),
				nombre: emisorNombre,
				mensaje: String(msg?.contenido ?? ''),
			});

			await incrementUnreadNotificationsCount();
			addToast(
				emisorNombre ? `Nuevo mensaje de ${emisorNombre}` : 'Tienes un nuevo mensaje'
			);
		});

		socket.on('grupo:mensaje:nuevo', async (msg: any) => {
			if (msg?.emisorId === userId) return;

			const active = activeChatRef.current;
			if (active?.type === 'group' && active.id === msg?.grupoId) return;

			const nombreGrupo =
				typeof msg?.nombreGrupo === 'string' && msg.nombreGrupo.trim()
					? msg.nombreGrupo.trim()
					: typeof msg?.grupo?.nombre === 'string' && msg.grupo.nombre.trim()
					? msg.grupo.nombre.trim()
					: null;

			await upsertUnreadGroupChatNotification({
				grupoId: String(msg?.grupoId ?? ''),
				nombreGrupo: nombreGrupo ?? 'Grupo',
				mensaje: String(msg?.contenido ?? ''),
			});

			await incrementUnreadNotificationsCount();
			addToast(
				nombreGrupo
					? `Nuevo mensaje en ${nombreGrupo}`
					: 'Nuevo mensaje de grupo'
			);
		});

		socket.on('contacto:solicitud:nueva', async (payload: any) => {
			if (payload?.solicitanteId === userId) return;

			const nombre = [payload?.solicitanteNombre, payload?.solicitanteApellido]
				.filter(Boolean)
				.join(' ')
				.trim();

			await upsertUnreadContactRequestNotification({
				solicitudId: String(payload?.solicitudId ?? ''),
				solicitanteId: String(payload?.solicitanteId ?? ''),
				nombre,
			});

			await incrementUnreadNotificationsCount();
			addToast(
				nombre ? `${nombre} te envió una solicitud de contacto` : 'Nueva solicitud de contacto'
			);
		});

		socket.on('contacto:solicitud:rechazada', async (payload: any) => {
			const receptorNombre = [payload?.receptorNombre, payload?.receptorApellido]
				.filter(Boolean)
				.join(' ')
				.trim();

			await upsertUnreadRejectedRequestNotification({
				solicitudId: String(payload?.solicitudId ?? ''),
				solicitanteId: String(payload?.solicitanteId ?? ''),
				receptorId: String(payload?.receptorId ?? ''),
				receptorNombre,
				tipo: 'contacto',
				updatedAt: typeof payload?.updatedAt === 'string' ? payload.updatedAt : undefined,
			});

			await incrementUnreadNotificationsCount();
			addToast(
				receptorNombre
					? `${receptorNombre} rechazó tu solicitud de contacto.`
					: 'Una solicitud fue rechazada.'
			);

			publishContactRequestRejected({
				solicitudId: String(payload?.solicitudId ?? ''),
				solicitanteId: String(payload?.solicitanteId ?? ''),
				receptorId: String(payload?.receptorId ?? ''),
				updatedAt: typeof payload?.updatedAt === 'string' ? payload.updatedAt : undefined,
			});
		});

		socket.on('grupo:solicitud:nueva', async (payload: any) => {
			const nombre = [payload?.solicitanteNombre, payload?.solicitanteApellido]
				.filter(Boolean)
				.join(' ')
				.trim();

			await upsertUnreadGroupEventNotification({
				id: `solicitud-${payload?.solicitudId ?? Date.now()}`,
				tipo: 'solicitud-ingreso',
				grupoId: String(payload?.grupoId ?? ''),
				grupoNombre: String(payload?.grupoNombre ?? 'Grupo'),
				mensaje: `${nombre || 'Un estudiante'} quiere unirse a tu grupo "${payload?.grupoNombre ?? 'Grupo'}".`,
				createdAt: new Date().toISOString(),
			});

			await incrementUnreadNotificationsCount();
			addToast(`${nombre || 'Un estudiante'} quiere unirse a "${payload?.grupoNombre ?? ''}"`);
		});

		socket.on('grupo:solicitud:resuelta', async (payload: any) => {
			const aprobada = payload?.estado === 'APROBADA';
			const grupoNombre = String(payload?.grupoNombre ?? 'Grupo');

			await upsertUnreadGroupEventNotification({
				id: `resolucion-${payload?.solicitudId ?? Date.now()}`,
				tipo: aprobada ? 'solicitud-aprobada' : 'solicitud-rechazada',
				grupoId: String(payload?.grupoId ?? ''),
				grupoNombre,
				mensaje: aprobada
					? `¡Tu solicitud para unirte a "${grupoNombre}" fue aprobada!`
					: `Tu solicitud para unirte a "${grupoNombre}" fue rechazada.`,
				createdAt: new Date().toISOString(),
			});

			await incrementUnreadNotificationsCount();
			addToast(
				aprobada
					? `Fuiste aceptado en "${grupoNombre}"`
					: `Tu solicitud a "${grupoNombre}" fue rechazada`
			);
		});

		socket.on('grupo:admin:transferido', async (payload: any) => {
			const esNuevoAdmin = payload?.nuevoAdminId === userId;
			const grupoNombre = String(payload?.grupoNombre ?? 'Grupo');
			const mensaje = esNuevoAdmin
				? `Ahora eres administrador del grupo "${grupoNombre}". ${payload?.anteriorAdminNombre || ''} te transfirió el rol.`
				: `Transferiste la administración de "${grupoNombre}" a ${payload?.nuevoAdminNombre || 'otro miembro'}.`;

			await upsertUnreadGroupEventNotification({
				id: `admin-${payload?.grupoId ?? Date.now()}-${Date.now()}`,
				tipo: 'admin-transferido',
				grupoId: String(payload?.grupoId ?? ''),
				grupoNombre,
				mensaje,
				createdAt: new Date().toISOString(),
			});

			await incrementUnreadNotificationsCount();
			addToast(
				esNuevoAdmin
					? `Ahora eres admin de "${grupoNombre}"`
					: `Transferiste admin de "${grupoNombre}"`
			);
		});

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, [isAuthenticated, userId]);

	return (
		<NotificationsContext.Provider
			value={{ unreadCount, setActiveChat, toasts, dismissToast }}
		>
			{children}
		</NotificationsContext.Provider>
	);
}

export function useNotifications(): NotificationsContextValue {
	const ctx = useContext(NotificationsContext);
	if (!ctx) {
		throw new Error('useNotifications must be used inside <NotificationsProvider>');
	}
	return ctx;
}
