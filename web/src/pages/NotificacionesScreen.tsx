import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, gruposService } from '../services';
import { clearUnreadNotificationsCount } from '../services/notificaciones-badge.service';
import {
	clearUnreadDirectChatNotification,
	clearUnreadGroupChatNotification,
	getUnreadDirectChatNotifications,
	getUnreadGroupChatNotifications,
	subscribeUnreadDirectChatNotifications,
	subscribeUnreadGroupChatNotifications,
	type UnreadDirectChatNotification,
	type UnreadGroupChatNotification,
} from '../services/notificaciones-chat.service';
import {
	clearUnreadContactRequestNotification,
	getUnreadContactRequestNotifications,
	subscribeUnreadContactRequestNotifications,
	type UnreadContactRequestNotification,
} from '../services/notificaciones-solicitudes.service';
import {
	clearUnreadRejectedRequestNotification,
	getUnreadRejectedRequestNotifications,
	subscribeUnreadRejectedRequestNotifications,
	type UnreadRejectedRequestNotification,
} from '../services/notificaciones-rechazos.service';
import { publishContactRequestRejectionSeen } from '../services/contacto-events.service';
import {
	clearUnreadGroupEventNotification,
	getUnreadGroupEventNotifications,
	subscribeUnreadGroupEventNotifications,
	type UnreadGroupEventNotification,
} from '../services/notificaciones-grupo.service';

type NotificationItem =
	| (UnreadDirectChatNotification & { kind: 'direct'; key: string })
	| (UnreadGroupChatNotification & { kind: 'group'; key: string })
	| (UnreadContactRequestNotification & { kind: 'request'; key: string })
	| (UnreadRejectedRequestNotification & { kind: 'request-rejected'; key: string })
	| (UnreadGroupEventNotification & { kind: 'grupo-event'; key: string });

export default function NotificacionesScreen() {
	const navigate = useNavigate();
	const [unreadDirectChats, setUnreadDirectChats] = useState<
		UnreadDirectChatNotification[]
	>([]);
	const [unreadGroupChats, setUnreadGroupChats] = useState<UnreadGroupChatNotification[]>(
		[]
	);
	const [unreadContactRequests, setUnreadContactRequests] = useState<
		UnreadContactRequestNotification[]
	>([]);
	const [unreadRejectedRequests, setUnreadRejectedRequests] = useState<
		UnreadRejectedRequestNotification[]
	>([]);
	const [unreadGroupEvents, setUnreadGroupEvents] = useState<
		UnreadGroupEventNotification[]
	>([]);
	const [esAdminDeGrupos, setEsAdminDeGrupos] = useState(false);
	const [processingInvitationId, setProcessingInvitationId] = useState<string | null>(
		null
	);
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(
		null
	);

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	const unreadChats = useMemo<NotificationItem[]>(() => {
		const directItems: NotificationItem[] = unreadDirectChats.map((i) => ({
			...i,
			kind: 'direct',
			key: `direct-${i.contactoId}`,
		}));
		const groupItems: NotificationItem[] = unreadGroupChats.map((i) => ({
			...i,
			kind: 'group',
			key: `group-${i.grupoId}`,
		}));
		const requestItems: NotificationItem[] = unreadContactRequests.map((i) => ({
			...i,
			kind: 'request',
			key: `request-${i.solicitudId}`,
		}));
		const rejectedItems: NotificationItem[] = unreadRejectedRequests.map((i) => ({
			...i,
			kind: 'request-rejected',
			key: `request-rejected-${i.solicitudId}`,
		}));
		const grupoEventItems: NotificationItem[] = unreadGroupEvents.map((i) => ({
			...i,
			kind: 'grupo-event',
			key: `grupo-event-${i.id}`,
		}));

		return [
			...directItems,
			...groupItems,
			...requestItems,
			...rejectedItems,
			...grupoEventItems,
		].sort((a, b) => {
			const dateA =
				a.kind === 'request' || a.kind === 'grupo-event'
					? new Date(a.createdAt).getTime()
					: new Date((a as any).updatedAt).getTime();
			const dateB =
				b.kind === 'request' || b.kind === 'grupo-event'
					? new Date(b.createdAt).getTime()
					: new Date((b as any).updatedAt).getTime();
			return dateB - dateA;
		});
	}, [
		unreadDirectChats,
		unreadGroupChats,
		unreadContactRequests,
		unreadRejectedRequests,
		unreadGroupEvents,
	]);

	useEffect(() => {
		const unsubDirect = subscribeUnreadDirectChatNotifications(setUnreadDirectChats);
		const unsubGroup = subscribeUnreadGroupChatNotifications(setUnreadGroupChats);
		const unsubReq = subscribeUnreadContactRequestNotifications(setUnreadContactRequests);
		const unsubRej = subscribeUnreadRejectedRequestNotifications(
			setUnreadRejectedRequests
		);
		const unsubEv = subscribeUnreadGroupEventNotifications(setUnreadGroupEvents);

		getUnreadDirectChatNotifications().then(setUnreadDirectChats);
		getUnreadGroupChatNotifications().then(setUnreadGroupChats);
		getUnreadContactRequestNotifications().then(setUnreadContactRequests);
		getUnreadRejectedRequestNotifications().then(setUnreadRejectedRequests);
		getUnreadGroupEventNotifications().then(setUnreadGroupEvents);

		return () => {
			unsubDirect();
			unsubGroup();
			unsubReq();
			unsubRej();
			unsubEv();
		};
	}, []);

	useEffect(() => {
		const verificarAdminGrupos = async () => {
			try {
				const userId = await authService.obtenerIdUsuarioActual();
				const misGrupos = await gruposService.getGrupos();
				setEsAdminDeGrupos(
					(misGrupos as any[]).some(
						(g) => g.creadorId === userId || g.administradorId === userId
					)
				);
			} catch {
				setEsAdminDeGrupos(false);
			}
		};
		verificarAdminGrupos();
		clearUnreadNotificationsCount(); // Clear global badge count when entering screen
	}, []);

	const handleVerMensaje = async (item: NotificationItem) => {
		if (item.kind === 'grupo-event' && item.tipo === 'solicitud-invitacion') {
			return;
		}
		if (item.kind === 'request') {
			await clearUnreadContactRequestNotification(item.solicitudId);
			navigate('/solicitudes');
			return;
		}
		if (item.kind === 'request-rejected') {
			await clearUnreadRejectedRequestNotification(item.solicitudId);
			publishContactRequestRejectionSeen({
				solicitudId: item.solicitudId,
				receptorId: item.receptorId,
			});
			return;
		}
		if (item.kind === 'grupo-event') {
			await clearUnreadGroupEventNotification(item.id);
			if (item.tipo === 'solicitud-ingreso') navigate('/solicitudes-grupo');
			else if (item.tipo === 'evento-nuevo') navigate('/eventos');
			else if (item.tipo !== 'notificacion-general') navigate('/grupos');
			return;
		}
		if (item.kind === 'direct') {
			await clearUnreadDirectChatNotification(item.contactoId);
			navigate(`/mensajes/directo/${item.contactoId}`);
			return;
		}
		await clearUnreadGroupChatNotification(item.grupoId);
		navigate(`/mensajes/grupo/${item.grupoId}`);
	};

	const handleAceptarInvitacion = async (item: UnreadGroupEventNotification) => {
		if (!item.solicitudId) return;
		setProcessingInvitationId(item.solicitudId);
		try {
			await gruposService.aceptarInvitacion(item.grupoId, item.solicitudId);
			await clearUnreadGroupEventNotification(item.id);
			navigate(`/grupos/${item.grupoId}`);
		} catch {
			showMsg('No se pudo aceptar la invitación', 'error');
		} finally {
			setProcessingInvitationId(null);
		}
	};

	const handleRechazarInvitacion = async (item: UnreadGroupEventNotification) => {
		if (!item.solicitudId) return;
		setProcessingInvitationId(item.solicitudId);
		try {
			await gruposService.rechazarInvitacion(item.grupoId, item.solicitudId);
			await clearUnreadGroupEventNotification(item.id);
			showMsg('Invitación rechazada');
		} catch {
			showMsg('No se pudo rechazar la invitación', 'error');
		} finally {
			setProcessingInvitationId(null);
		}
	};

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				.uc-notif-card { background: #fff; border: 1px solid #e8eef4; border-radius: 12px; padding: 18px 20px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px; transition: box-shadow 0.15s; }
				.uc-notif-card:hover { box-shadow: 0 4px 12px rgba(0,62,112,0.06); }
				.uc-notif-type { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; align-self: flex-start; }
				.uc-notif-type.direct { background: #eafaf1; color: #1e8449; }
				.uc-notif-type.group { background: #e8f0fe; color: #1a73e8; }
				.uc-notif-type.request { background: #fce8b2; color: #b06000; }
				.uc-notif-type.reject { background: #fdf0f0; color: #c0392b; }
				.uc-btn-view { padding: 8px 16px; background: #f0f4f8; color: #003e70; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; align-self: flex-start; transition: background 0.15s; margin-top: 4px; }
				.uc-btn-view:hover { background: #e2e8f0; }
				.uc-admin-card { background: #fff; border: 1px solid #c5d3df; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px; display: flex; alignItems: center; gap: 12px; cursor: pointer; transition: all 0.15s; }
				.uc-admin-card:hover { border-color: #003e70; background: #f8fafc; }
				@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
			`}</style>

			{toast && (
				<div
					style={{
						position: 'fixed',
						bottom: 24,
						right: 24,
						zIndex: 9999,
						backgroundColor: toast.type === 'error' ? '#c0392b' : '#27ae60',
						color: '#fff',
						padding: '12px 20px',
						borderRadius: 10,
						fontSize: 14,
						fontWeight: 500,
						boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
					}}
				>
					{toast.msg}
				</div>
			)}

			<div style={s.content}>
				<h1 style={s.pageTitle}>Notificaciones</h1>
				<p style={s.pageSubtitle}>
					Aquí verás chats y solicitudes pendientes por revisar.
				</p>

				{esAdminDeGrupos && (
					<div className="uc-admin-card" onClick={() => navigate('/solicitudes-grupo')}>
						<div
							style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: '#e8f0fe',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 20,
							}}
						>
							👥
						</div>
						<div>
							<p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#00284d' }}>
								Solicitudes de ingreso a grupos
							</p>
							<p style={{ margin: '2px 0 0', fontSize: 13, color: '#7a9ab5' }}>
								Revisa quién quiere unirse a tus grupos
							</p>
						</div>
					</div>
				)}

				{unreadChats.length === 0 ? (
					<div style={s.emptyState}>
						<span style={{ fontSize: 44 }}>🔔</span>
						<p
							style={{
								fontSize: 16,
								fontWeight: 600,
								color: '#00284d',
								margin: '12px 0 4px',
							}}
						>
							No tienes notificaciones
						</p>
						<p style={{ color: '#7a9ab5', fontSize: 14 }}>
							Cuando te escriban o recibas una solicitud, aparecerá aquí.
						</p>
					</div>
				) : (
					<div style={{ animation: 'fadeUp 0.3s ease' }}>
						{unreadChats.map((item) => {
							const isDirect = item.kind === 'direct';
							const isGroup = item.kind === 'group';
							const isReq = item.kind === 'request';
							const isRej = item.kind === 'request-rejected';
							const isEv = item.kind === 'grupo-event';

							const isInvite = isEv && item.tipo === 'solicitud-invitacion';
							const title = isDirect
								? item.nombre
								: isGroup
									? item.nombreGrupo
									: isReq
										? item.nombre
										: isEv
											? item.grupoNombre
											: 'Solicitud rechazada';
							const chatItem = item as any;
							const message = isReq
								? 'Te envió una solicitud de contacto.'
								: isRej
									? `Tu solicitud a ${chatItem.receptorNombre || 'usuario'} fue rechazada.`
									: isEv
										? chatItem.mensaje
										: chatItem.ultimoMensaje || 'Te envió un mensaje nuevo';
							const typeClass = isDirect
								? 'direct'
								: isGroup
									? 'group'
									: isReq
										? 'request'
										: 'reject';
							const typeLabel = isDirect
								? 'Mensaje directo'
								: isGroup
									? 'Mensaje de grupo'
									: isReq
										? 'Solicitud de contacto'
										: isInvite
											? 'Invitación de grupo'
											: isEv
												? 'Evento de grupo'
												: 'Solicitud rechazada';

							return (
								<div key={item.key} className="uc-notif-card">
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<h3
											style={{
												margin: 0,
												fontSize: 16,
												fontWeight: 600,
												color: '#00284d',
											}}
										>
											{title}
										</h3>
										{(isDirect || isGroup) && chatItem.mensajesNoLeidos > 1 && (
											<span
												style={{
													backgroundColor: '#e74c3c',
													color: '#fff',
													fontSize: 11,
													fontWeight: 700,
													padding: '2px 8px',
													borderRadius: 10,
												}}
											>
												{chatItem.mensajesNoLeidos} nuevos
											</span>
										)}
									</div>
									<span className={`uc-notif-type ${typeClass}`}>{typeLabel}</span>
									<p style={{ margin: 0, fontSize: 14, color: '#4a6a85' }}>{message}</p>
									{isInvite ? (
										<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
											<button
												className="uc-btn-view"
												onClick={() => handleAceptarInvitacion(item)}
												disabled={processingInvitationId === item.solicitudId}
											>
												{processingInvitationId === item.solicitudId ? '...' : 'Aceptar'}
											</button>
											<button
												className="uc-btn-view"
												onClick={() => handleRechazarInvitacion(item)}
												disabled={processingInvitationId === item.solicitudId}
											>
												{processingInvitationId === item.solicitudId ? '...' : 'Rechazar'}
											</button>
										</div>
									) : (
										<button
											className="uc-btn-view"
											onClick={() => handleVerMensaje(item)}
										>
											{isReq
												? 'Ver solicitud'
												: isRej
													? 'Visto'
													: isEv
														? 'Ver evento'
														: 'Ver mensaje'}
										</button>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	page: {
		minHeight: '100%',
		backgroundColor: '#f0f4f8',
		fontFamily: "'Inter', sans-serif",
	},
	content: { maxWidth: 640, margin: '0 auto', padding: '32px 20px 48px' },
	pageTitle: { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#00284d' },
	pageSubtitle: { margin: '0 0 24px', fontSize: 15, color: '#7a9ab5' },
	emptyState: {
		textAlign: 'center',
		padding: '64px 0',
		backgroundColor: '#fff',
		borderRadius: 14,
		border: '1px dashed #c5d3df',
	},
};
