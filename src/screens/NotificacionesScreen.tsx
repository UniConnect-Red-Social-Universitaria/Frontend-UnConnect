import React, { useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	Pressable,
	Image,
	useWindowDimensions,
	FlatList,
	StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/PrincipalScreenStyles';
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
import { authService } from '../services';
import { showToast } from '../utils/toast';
import type { RootStackParamList } from '../navigation/RootNavigator';

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
	const { width } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;

	type NotificationItem =
		| (UnreadDirectChatNotification & { kind: 'direct'; key: string })
		| (UnreadGroupChatNotification & { kind: 'group'; key: string })
		| (UnreadContactRequestNotification & { kind: 'request'; key: string });

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

		return [...directItems, ...groupItems, ...requestItems].sort((a, b) => {
			const dateA =
				a.kind === 'request'
					? new Date(a.createdAt).getTime()
					: new Date(a.updatedAt).getTime();
			const dateB =
				b.kind === 'request'
					? new Date(b.createdAt).getTime()
					: new Date(b.updatedAt).getTime();
			return dateB - dateA;
		});
	}, [unreadDirectChats, unreadGroupChats, unreadContactRequests]);

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

		void getUnreadDirectChatNotifications().then((items) => {
			setUnreadDirectChats(items);
		});

		void getUnreadGroupChatNotifications().then((items) => {
			setUnreadGroupChats(items);
		});

		void getUnreadContactRequestNotifications().then((items) => {
			setUnreadContactRequests(items);
		});

		return () => {
			unsubscribeDirect();
			unsubscribeGroup();
			unsubscribeRequests();
		};
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
							: item.nombre}
				</Text>
				{item.kind !== 'request' && item.mensajesNoLeidos > 1 ? (
					<Text style={localStyles.counter}>{item.mensajesNoLeidos} nuevos</Text>
				) : null}
			</View>
			<Text style={localStyles.typePill}>
				{item.kind === 'direct'
					? 'Mensaje directo'
					: item.kind === 'group'
						? 'Mensaje de grupo'
						: 'Solicitud de contacto'}
			</Text>
			<Text style={localStyles.cardMessage} numberOfLines={2}>
				{item.kind === 'request'
					? 'Te envio una solicitud de contacto.'
					: item.ultimoMensaje || 'Te envio un mensaje nuevo'}
			</Text>

			<Pressable
				style={localStyles.viewButton}
				onPress={() => {
					void handleVerMensaje(item);
				}}
			>
				<Text style={localStyles.viewButtonText}>
					{item.kind === 'request' ? 'Ver solicitud' : 'Ver mensaje'}
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
				<Pressable onPress={() => navigation.navigate('Grupos')}>
					<Text style={styles.navButtonText}>Grupos</Text>
				</Pressable>

				<Pressable onPress={() => navigation.navigate('Eventos')}>
					<Text style={styles.navButtonText}>Eventos</Text>
				</Pressable>

				<Pressable onPress={() => navigation.navigate('Contactos')}>
					<Text style={styles.navButtonText}>Contactos</Text>
				</Pressable>
			</View>
		</View>
	);
}

const localStyles = StyleSheet.create({
	listContainer: {
		paddingBottom: 16,
		gap: 12,
	},
	emptyListContainer: {
		flexGrow: 1,
	},
	emptyState: {
		paddingTop: 28,
		alignItems: 'center',
		paddingHorizontal: 18,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#003d70',
		marginBottom: 8,
	},
	emptyText: {
		fontSize: 14,
		textAlign: 'center',
		color: '#4a5a6a',
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 14,
		borderWidth: 1,
		borderColor: '#D8E3EE',
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0A4478',
	},
	counter: {
		fontSize: 12,
		fontWeight: '700',
		color: '#C62828',
	},
	cardMessage: {
		fontSize: 14,
		color: '#3E566E',
		marginBottom: 10,
	},
	typePill: {
		alignSelf: 'flex-start',
		fontSize: 11,
		fontWeight: '700',
		color: '#0A4478',
		backgroundColor: '#E8F2FB',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 999,
		marginBottom: 8,
	},
	viewButton: {
		alignSelf: 'flex-start',
		backgroundColor: '#003d70',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	viewButtonText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#FFFFFF',
	},
});
