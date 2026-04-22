import React, { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	FlatList,
	Image,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { styles as principalStyles } from '../styles/PrincipalScreenStyles';
import { authService, usuariosService } from '../services';
import { showToast } from '../utils/toast';
import { clearUnreadContactRequestNotification } from '../services/notificaciones-solicitudes.service';
import type { SolicitudPendiente } from '../types/api.types';

type SolicitudesNavigationProp = StackNavigationProp<RootStackParamList, 'Solicitudes'>;

type Props = {
	navigation: SolicitudesNavigationProp;
};

export default function SolicitudesScreen({ navigation }: Props) {
	const [solicitudes, setSolicitudes] = useState<SolicitudPendiente[]>([]);
	const [loading, setLoading] = useState(true);
	const [processingSolicitudId, setProcessingSolicitudId] = useState<string | null>(null);
	const { width } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;

	const cargarSolicitudes = useCallback(async () => {
		setLoading(true);
		try {
			const data = await usuariosService.getSolicitudesRecibidas();
			setSolicitudes(data);
		} catch {
			showToast.error('No se pudieron cargar las solicitudes');
			setSolicitudes([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void cargarSolicitudes();
	}, [cargarSolicitudes]);

	useFocusEffect(
		React.useCallback(() => {
			void cargarSolicitudes();
			return undefined;
		}, [cargarSolicitudes])
	);

	const handleLogout = async () => {
		try {
			await authService.logout();
			navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
		} catch {
			showToast.error('Error al cerrar sesion');
		}
	};

	const procesarSolicitud = async (
		solicitud: SolicitudPendiente,
		action: 'aceptar' | 'rechazar'
	) => {
		setProcessingSolicitudId(solicitud.solicitudId);

		try {
			if (action === 'aceptar') {
				await usuariosService.aceptarSolicitud(solicitud.solicitudId);
			} else {
				await usuariosService.rechazarSolicitud(solicitud.solicitudId);
			}

			await clearUnreadContactRequestNotification(solicitud.solicitudId);
			setSolicitudes((prev) =>
				prev.filter((item) => item.solicitudId !== solicitud.solicitudId)
			);
		} catch {
			Alert.alert('Error', 'No fue posible procesar la solicitud.');
		} finally {
			setProcessingSolicitudId(null);
		}
	};

	const renderItem = ({ item }: { item: SolicitudPendiente }) => {
		const estaProcesando = processingSolicitudId === item.solicitudId;

		return (
			<View style={localStyles.card}>
				<Text style={localStyles.name}>{item.nombre}</Text>
				<Text style={localStyles.email}>{item.correo}</Text>

				<View style={localStyles.actionsRow}>
					<Pressable
						style={({ pressed }) => [
							localStyles.acceptButton,
							pressed && { opacity: 0.85 },
							estaProcesando && { opacity: 0.45 },
						]}
						disabled={estaProcesando}
						onPress={() => {
							void procesarSolicitud(item, 'aceptar');
						}}
					>
						<Text style={localStyles.actionText}>Aceptar</Text>
					</Pressable>

					<Pressable
						style={({ pressed }) => [
							localStyles.rejectButton,
							pressed && { opacity: 0.85 },
							estaProcesando && { opacity: 0.45 },
						]}
						disabled={estaProcesando}
						onPress={() => {
							void procesarSolicitud(item, 'rechazar');
						}}
					>
						<Text style={localStyles.actionText}>Rechazar</Text>
					</Pressable>
				</View>
			</View>
		);
	};

	return (
		<View style={principalStyles.container}>
			<View style={principalStyles.header}>
				<View style={principalStyles.headerLeft}>
					<Image
						source={require('../../assets/images/logo-caldas.png')}
						style={[principalStyles.brandLogo, { width: logoWidth }]}
						resizeMode="contain"
					/>
				</View>

				<View style={principalStyles.headerCenter}>
					<Pressable
						style={principalStyles.iconButton}
						onPress={() => navigation.navigate('EditarPerfil')}
					>
						<Ionicons name="person-circle-outline" size={32} color="#007AFF" />
					</Pressable>
					<Pressable
						style={principalStyles.iconButton}
						onPress={() => navigation.navigate('Notificaciones')}
					>
						<Ionicons name="notifications-outline" size={32} color="#007AFF" />
					</Pressable>
				</View>

				<View style={principalStyles.headerRight}>
					<Pressable style={principalStyles.logoutButton} onPress={handleLogout}>
						<Text style={principalStyles.logoutText}>Salir</Text>
						<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
					</Pressable>
				</View>
			</View>

			<View style={principalStyles.mainContent}>
				<Text style={principalStyles.greeting}>Solicitudes</Text>
				<Text style={principalStyles.subtitle}>
					Revisa las solicitudes de contacto y decide si aceptas o rechazas.
				</Text>

				{loading ? (
					<Text style={localStyles.centerText}>Cargando solicitudes...</Text>
				) : (
					<FlatList
						data={solicitudes}
						renderItem={renderItem}
						keyExtractor={(item) => item.solicitudId}
						contentContainerStyle={
							solicitudes.length === 0
								? localStyles.emptyListContainer
								: localStyles.listContainer
						}
						ListEmptyComponent={
							<View style={localStyles.emptyState}>
								<Text style={localStyles.emptyTitle}>
									No tienes solicitudes pendientes
								</Text>
								<Text style={localStyles.emptyText}>
									Cuando recibas una solicitud, aparecera aqui.
								</Text>
							</View>
						}
					/>
				)}
			</View>

			<View style={principalStyles.bottomBar}>
				<Pressable onPress={() => navigation.navigate('Grupos')}>
					<Text style={principalStyles.navButtonText}>Grupos</Text>
				</Pressable>

				<Pressable onPress={() => navigation.navigate('Eventos')}>
					<Text style={principalStyles.navButtonText}>Eventos</Text>
				</Pressable>

				<Pressable onPress={() => navigation.navigate('Contactos')}>
					<Text style={principalStyles.navButtonText}>Contactos</Text>
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
	centerText: {
		textAlign: 'center',
		fontSize: 15,
		color: '#55657a',
		marginTop: 16,
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
	name: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0A4478',
	},
	email: {
		fontSize: 13,
		color: '#58708A',
		marginTop: 2,
		marginBottom: 10,
	},
	actionsRow: {
		flexDirection: 'row',
		gap: 10,
	},
	acceptButton: {
		backgroundColor: '#0f766e',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	rejectButton: {
		backgroundColor: '#b91c1c',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	actionText: {
		color: '#FFFFFF',
		fontSize: 13,
		fontWeight: '700',
	},
});
