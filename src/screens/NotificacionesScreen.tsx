import React, { useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	Pressable,
	Image,
	useWindowDimensions,
	FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/PrincipalScreenStyles';
import { localStyles } from '../styles/NotificacionesScreen.styles';
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
import { authService, gruposService } from '../services';
import { showToast } from '../utils/toast';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
	clearUnreadGroupEventNotification,
	getUnreadGroupEventNotifications,
	subscribeUnreadGroupEventNotifications,
	type UnreadGroupEventNotification,
} from '../services/notificaciones-grupo.service';

type NotificacionesNavigationProp = StackNavigationProp<
	RootStackParamList,
	'Notificaciones'
>;

export default function NotificacionesScreen({
	navigation,
}: {
	navigation: NotificacionesNavigationProp;
}) {
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
	const [unreadGroupEvents, setUnreadGroupEvents] = useState<UnreadGroupEventNotification[]>([]);
	const [esAdminDeGrupos, setEsAdminDeGrupos] = useState(false);
	const { width } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;

	type NotificationItem =
		| (UnreadDirectChatNotification & { kind: 'direct'; key: string })
		| (UnreadGroupChatNotification & { kind: 'group'; key: string })
		| (UnreadContactRequestNotification & { kind: 'request'; key: string })
		| (UnreadRejectedRequestNotification & { kind: 'request-rejected'; key: string })
		| (UnreadGroupEventNotification & { kind: 'grupo-event'; key: string });

	const unreadChats = useMemo<NotificationItem[]>(() => {
		const directItems: NotificationItem[] = unreadDirectChats.map((item) => ({
			...item,
			kind: 'direct',
			key: `direct-${item.contactoId}`,
		}));

		const groupItems: NotificationItem[] = unreadGroupChats.map((item) => ({
			...item,
			kind: 'group',
			key: `group-${item.grupoId}`,
		}));

		const requestItems: NotificationItem[] = unreadContactRequests.map((item) => ({
			...item,
			kind: 'request',
			key: `request-${item.solicitudId}`,
		}));

		const rejectedItems: NotificationItem[] = unreadRejectedRequests.map((item) => ({
			...item,
			kind: 'request-rejected',
			key: `request-rejected-${item.solicitudId}`,
		}));

		const grupoEventItems: NotificationItem[] = unreadGroupEvents.map((item) => ({
			...item,
			kind: 'grupo-event',
			key: `grupo-event-${item.id}`,
		}));

		return [...directItems, ...groupItems, ...requestItems, ...rejectedItems, ...grupoEventItems].sort(
			(a, b) => {
				const dateA =
					a.kind === 'request'
						? new Date(a.createdAt).getTime()
						: a.kind === 'request-rejected'
							? new Date(a.updatedAt).getTime()
							: a.kind === 'grupo-event'
								? new Date(a.createdAt).getTime()
								: new Date(a.updatedAt).getTime();
				const dateB =
					b.kind === 'request'
						? new Date(b.createdAt).getTime()
						: b.kind === 'request-rejected'
							? new Date(b.updatedAt).getTime()
							: b.kind === 'grupo-event'
								? new Date(b.createdAt).getTime()
								: new Date(b.updatedAt).getTime();
				return dateB - dateA;
			}
		);
	}, [
		unreadDirectChats,
		unreadGroupChats,
		unreadContactRequests,
		unreadRejectedRequests,
		unreadGroupEvents,
	]);

	useEffect(() => {
		const unsubscribeDirect = subscribeUnreadDirectChatNotifications((items) => {
			setUnreadDirectChats(items);
		});

		const unsubscribeGroup = subscribeUnreadGroupChatNotifications((items) => {
			setUnreadGroupChats(items);
		});

		const unsubscribeRequests = subscribeUnreadContactRequestNotifications((items) => {
			setUnreadContactRequests(items);
		});

		const unsubscribeRejected = subscribeUnreadRejectedRequestNotifications((items) => {
			setUnreadRejectedRequests(items);
		});

		const unsubscribeGroupEvents = subscribeUnreadGroupEventNotifications((items) => {
			setUnreadGroupEvents(items);
		});

		void getUnreadDirectChatNotifications().then((items) => {
			setUnreadDirectChats(items);
		});

		void getUnreadGroupChatNotifications().then((items) => {
			setUnreadGroupChats(items);
		});

		void getUnreadContactRequestNotifications().then((items) => {
			setUnreadContactRequests(items);
		});

		void getUnreadRejectedRequestNotifications().then((items) => {
			setUnreadRejectedRequests(items);
		});

		void getUnreadGroupEventNotifications().then((items) => {
			setUnreadGroupEvents(items);
		});

		return () => {
			unsubscribeDirect();
			unsubscribeGroup();
			unsubscribeRequests();
			unsubscribeRejected();
			unsubscribeGroupEvents();
		};
	}, []);

	useEffect(() => {
		const verificarAdminGrupos = async () => {
			try {
				const userId = await authService.obtenerIdUsuarioActual();
				const misGrupos = await gruposService.getGrupos();
				const tieneGrupos = (misGrupos as any[]).some(
					(g) => g.creadorId === userId || g.administradorId === userId,
				);
				setEsAdminDeGrupos(tieneGrupos);
			} catch {
				setEsAdminDeGrupos(false);
			}
		};
		verificarAdminGrupos();
	}, []);

	useFocusEffect(
		React.useCallback(() => {
			void clearUnreadNotificationsCount();
			return undefined;
		}, [])
	);

	const handleLogout = async () => {
		try {
			await authService.logout();
			navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
		} catch {
			showToast.error('Error al cerrar sesión');
		}
	};

	const handleVerMensaje = async (item: NotificationItem) => {
		if (item.kind === 'request') {
			await clearUnreadContactRequestNotification(item.solicitudId);
			navigation.navigate('Solicitudes');
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
			if (item.tipo === 'solicitud-ingreso') {
				navigation.navigate('SolicitudesGrupo');
			} else {
				navigation.navigate('Grupos');
			}
			return;
		}

		if (item.kind === 'direct') {
			await clearUnreadDirectChatNotification(item.contactoId);
			navigation.navigate('MensajeDirecto', {
				contactoId: item.contactoId,
				nombre: item.nombre,
				correo: 'Contacto',
			});
			return;
		}

		await clearUnreadGroupChatNotification(item.grupoId);
		navigation.navigate('MensajeGrupo', {
			grupoId: item.grupoId,
			nombreGrupo: item.nombreGrupo,
		});
	};

	const renderNotification = ({ item }: { item: NotificationItem }) => (
		<View style={localStyles.card}>
			<View style={localStyles.cardHeader}>
				<Text style={localStyles.cardTitle}>
					{item.kind === 'direct'
						? item.nombre
						: item.kind === 'group'
							? item.nombreGrupo
							: item.kind === 'request'
								? item.nombre
								: item.kind === 'grupo-event'
									? item.grupoNombre
									: 'Solicitud rechazada'}
				</Text>
				{(item.kind === 'direct' || item.kind === 'group') && item.mensajesNoLeidos > 1 ? (
					<Text style={localStyles.counter}>{item.mensajesNoLeidos} nuevos</Text>
				) : null}
			</View>
			<Text style={localStyles.typePill}>
				{item.kind === 'direct'
					? 'Mensaje directo'
					: item.kind === 'group'
						? 'Mensaje de grupo'
						: item.kind === 'request'
							? 'Solicitud de contacto'
							: item.kind === 'grupo-event'
								? item.tipo === 'solicitud-ingreso'
									? 'Solicitud de grupo'
									: item.tipo === 'solicitud-aprobada'
										? 'Solicitud aprobada'
										: item.tipo === 'solicitud-rechazada'
											? 'Solicitud rechazada'
											: 'Cambio de administrador'
								: 'Solicitud rechazada'}
			</Text>
			<Text style={localStyles.cardMessage} numberOfLines={2}>
				{item.kind === 'request'
					? 'Te envio una solicitud de contacto.'
					: item.kind === 'request-rejected'
						? `Tu solicitud a ${item.receptorNombre || 'usuario'} fue rechazada. Puedes volver a enviarla.`
						: item.kind === 'grupo-event'
							? item.mensaje
							: item.ultimoMensaje || 'Te envio un mensaje nuevo'}
			</Text>

			<Pressable
				style={localStyles.viewButton}
				onPress={() => {
					void handleVerMensaje(item);
				}}
			>
				<Text style={localStyles.viewButtonText}>
					{item.kind === 'request'
						? 'Ver solicitud'
						: item.kind === 'request-rejected'
							? 'Visto'
							: item.kind === 'grupo-event'
								? item.tipo === 'solicitud-ingreso'
									? 'Ver solicitudes'
									: 'Ver grupo'
								: 'Ver mensaje'}
				</Text>
			</Pressable>
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Image
						source={require('../../assets/images/logo-caldas.png')}
						style={[styles.brandLogo, { width: logoWidth }]}
						resizeMode="contain"
					/>
				</View>

				<View style={styles.headerCenter}>
					<Pressable
						style={styles.iconButton}
						onPress={() => navigation.navigate('EditarPerfil')}
					>
						<Ionicons name="person-circle-outline" size={32} color="#007AFF" />
					</Pressable>
					<Pressable
						style={styles.iconButton}
						onPress={() => navigation.navigate('Notificaciones')}
					>
						<Ionicons name="notifications-outline" size={32} color="#007AFF" />
					</Pressable>
				</View>

				<View style={styles.headerRight}>
					<Pressable style={styles.logoutButton} onPress={handleLogout}>
						<Text style={styles.logoutText}>Salir</Text>
						<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
					</Pressable>
				</View>
			</View>

			<View style={styles.mainContent}>
				<Text style={styles.greeting}>Notificaciones</Text>
				<Text style={styles.subtitle}>
					Aqui veras chats y solicitudes pendientes por revisar.
				</Text>

				{esAdminDeGrupos ? (
					<Pressable
						style={{
							backgroundColor: '#FFFFFF',
							borderRadius: 12,
							padding: 14,
							marginBottom: 16,
							borderWidth: 1,
							borderColor: '#D8E3EE',
							flexDirection: 'row',
							alignItems: 'center',
							gap: 12,
						}}
						onPress={() => navigation.navigate('SolicitudesGrupo')}
					>
						<View
							style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: '#EAF3FF',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Ionicons name="people-circle-outline" size={22} color="#003d70" />
						</View>
						<View style={{ flex: 1 }}>
							<Text style={{ fontSize: 15, fontWeight: '700', color: '#0A4478' }}>
								Solicitudes de ingreso a grupos
							</Text>
							<Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
								Revisa quién quiere unirse a tus grupos
							</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#94A3B8" />
					</Pressable>
				) : null}

				<FlatList
					data={unreadChats}
					renderItem={renderNotification}
					keyExtractor={(item) => item.key}
					contentContainerStyle={
						unreadChats.length === 0
							? localStyles.emptyListContainer
							: localStyles.listContainer
					}
					ListEmptyComponent={
						<View style={localStyles.emptyState}>
							<Text style={localStyles.emptyTitle}>No tienes chats pendientes</Text>
							<Text style={localStyles.emptyText}>
								Cuando te escriban o recibas una solicitud, aparecera aqui hasta que
								revises esa notificacion.
							</Text>
						</View>
					}
				/>
			</View>

			<View style={styles.bottomBar}>
				<Pressable
					style={styles.footerTab}
					onPress={() => navigation.navigate('Principal')}
					accessibilityLabel="Inicio"
				>
					<Ionicons name="home-outline" size={24} style={styles.footerIcon} />
				</Pressable>

				<Pressable
					style={styles.footerTab}
					onPress={() => navigation.navigate('Grupos')}
					accessibilityLabel="Grupos"
				>
					<Ionicons name="people-outline" size={24} style={styles.footerIcon} />
				</Pressable>

				<Pressable
					style={styles.footerTab}
					onPress={() => navigation.navigate('Eventos')}
					accessibilityLabel="Eventos"
				>
					<Ionicons name="calendar-outline" size={24} style={styles.footerIcon} />
				</Pressable>

				<Pressable
					style={styles.footerTab}
					onPress={() => navigation.navigate('Contactos')}
					accessibilityLabel="Contactos"
				>
					<Ionicons name="chatbubbles-outline" size={24} style={styles.footerIcon} />
				</Pressable>
			</View>
		</View>
	);
}
