import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
	View,
	Text,
	Image,
	FlatList,
	StyleSheet,
	ListRenderItem,
	SafeAreaView,
	Pressable,
	Alert,
} from 'react-native';
import { usuariosService } from '../services';

type Contacto = {
	id: string;
	nombre: string;
	correo: string;
};

type SolicitudPendiente = {
	solicitudId: string;
	solicitanteId: string;
	nombre: string;
	correo: string;
	createdAt?: string;
};

export default function ContactScreen() {
	const navigation =
		useNavigation<StackNavigationProp<RootStackParamList, 'Contactos'>>();

	const [contactos, setContactos] = useState<Contacto[]>([]);
	const [solicitudesPendientes, setSolicitudesPendientes] = useState<
		SolicitudPendiente[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [processingSolicitudId, setProcessingSolicitudId] = useState<string | null>(null);

	const cargarDatos = async () => {
		setLoading(true);
		setError(null);

		try {
			const [contactosData, solicitudesData] = await Promise.all([
				usuariosService.getCompaneros(),
				usuariosService.getSolicitudesRecibidas(),
			]);

			setContactos(contactosData);
			setSolicitudesPendientes(solicitudesData);
		} catch (e) {
			setError('Error de red al cargar datos');
			setSolicitudesPendientes([]);
		}

		setLoading(false);
	};

	useEffect(() => {
		cargarDatos();
	}, []);

	const procesarSolicitud = async (
		solicitudId: string,
		action: 'aceptar' | 'rechazar'
	) => {
		setProcessingSolicitudId(solicitudId);

		try {
			if (action === 'aceptar') {
				await usuariosService.aceptarSolicitud(solicitudId);
			} else {
				await usuariosService.rechazarSolicitud(solicitudId);
			}

			setSolicitudesPendientes((prev) =>
				prev.filter((s) => s.solicitudId !== solicitudId)
			);

			if (action === 'aceptar') {
				// Al aceptar una solicitud se refrescan contactos para mostrar el nuevo companero.
				await cargarDatos();
			}
		} catch (_e) {
			Alert.alert('Error de red', 'No fue posible procesar la solicitud.');
		} finally {
			setProcessingSolicitudId(null);
		}
	};

	const renderItem: ListRenderItem<Contacto> = ({ item }) => (
		<View style={styles.card}>
			<View style={styles.infoContainer}>
				<Text style={styles.name}>{item.nombre || 'Nombre no disponible'}</Text>
				<Text style={styles.email}>{item.correo || 'Correo no disponible'}</Text>
			</View>
			<Pressable
				style={({ pressed }) => [styles.messageButton, pressed && { opacity: 0.8 }]}
				onPress={() => {
					if (item.id) {
						navigation.navigate('MensajeDirecto', {
							contactoId: item.id,
							nombre: item.nombre,
							correo: item.correo,
						});
					} else {
						Alert.alert('Error', 'No se pudo obtener el ID del contacto');
					}
				}}
			>
				<Text style={styles.messageButtonText}>Enviar Mensaje</Text>
			</Pressable>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			{/* 🔸 HEADER FIJO */}
			<View style={styles.header}>
				<View style={styles.headerContent}>
					<Image
						source={require('../../assets/images/logo-caldas.png')}
						style={styles.logo}
						resizeMode="contain"
					/>
					<Text style={styles.appName}>UniConnect</Text>
				</View>
			</View>

			{/* 🔹 CONTENIDO FLEXIBLE */}
			<View style={styles.content}>
				{loading ? (
					<Text style={styles.centerText}>Cargando contactos...</Text>
				) : error ? (
					<Text style={[styles.centerText, { color: 'red' }]}>{error}</Text>
				) : (
					<FlatList<Contacto>
						style={{ flex: 1 }}
						data={contactos}
						keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
						renderItem={renderItem}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.listContent}
						ListHeaderComponent={
							<View style={styles.screenHeader}>
								<Text style={styles.title}>Contactos</Text>
								<Text style={styles.subtitle}>
									Aquí podrás ver y gestionar tus contactos de UniConnect.
								</Text>
								<View style={styles.solicitudesSection}>
									<Text style={styles.solicitudesTitle}>Solicitudes pendientes</Text>
									{solicitudesPendientes.length === 0 ? (
										<Text style={styles.solicitudVaciaText}>
											No tienes solicitudes pendientes.
										</Text>
									) : (
										solicitudesPendientes.map((solicitud) => {
											const estaProcesando =
												processingSolicitudId === solicitud.solicitudId;

											return (
												<View key={solicitud.solicitudId} style={styles.solicitudCard}>
													<View style={styles.solicitudInfo}>
														<Text style={styles.solicitudNombre}>{solicitud.nombre}</Text>
														<Text style={styles.solicitudCorreo}>{solicitud.correo}</Text>
													</View>

													<View style={styles.solicitudActions}>
														<Pressable
															style={({ pressed }) => [
																styles.aceptarButton,
																pressed && { opacity: 0.85 },
																estaProcesando && { opacity: 0.45 },
															]}
															onPress={() =>
																procesarSolicitud(solicitud.solicitudId, 'aceptar')
															}
															disabled={estaProcesando}
														>
															<Text style={styles.aceptarButtonText}>Aceptar</Text>
														</Pressable>

														<Pressable
															style={({ pressed }) => [
																styles.rechazarButton,
																pressed && { opacity: 0.85 },
																estaProcesando && { opacity: 0.45 },
															]}
															onPress={() =>
																procesarSolicitud(solicitud.solicitudId, 'rechazar')
															}
															disabled={estaProcesando}
														>
															<Text style={styles.rechazarButtonText}>Rechazar</Text>
														</Pressable>
													</View>
												</View>
											);
										})
									)}
								</View>
							</View>
						}
						ListEmptyComponent={
							<Text style={styles.centerText}>No tienes contactos agregados aun.</Text>
						}
					/>
				)}
			</View>

			{/* 🔵 FOOTER FIJO */}
			<View style={styles.footer}>
				<Text style={styles.footerText}>UniConnect © 2026</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8fafc',
	},

	header: {
		height: 70,
		backgroundColor: '#002855',
		justifyContent: 'center',
		paddingHorizontal: 16,
	},

	headerContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	logo: {
		width: 36,
		height: 36,
		marginRight: 10,
	},

	appName: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},

	content: {
		flex: 1,
	},

	centerText: {
		textAlign: 'center',
		color: '#64748b',
		fontSize: 15,
		paddingHorizontal: 20,
		marginTop: 30,
	},

	listContent: {
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 20,
	},

	screenHeader: {
		marginBottom: 20,
	},

	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#002855',
		marginBottom: 4,
	},

	subtitle: {
		fontSize: 14,
		color: '#64748b',
	},

	solicitudesSection: {
		marginTop: 16,
		padding: 14,
		borderWidth: 1,
		borderColor: '#dbe6f2',
		borderRadius: 12,
		backgroundColor: '#f7fbff',
	},

	solicitudesTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#002855',
		marginBottom: 10,
	},

	solicitudVaciaText: {
		fontSize: 14,
		color: '#64748b',
	},

	solicitudCard: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#e1e9f3',
		borderRadius: 10,
		padding: 12,
		marginBottom: 10,
	},

	solicitudInfo: {
		marginBottom: 10,
	},

	solicitudNombre: {
		fontSize: 15,
		fontWeight: '700',
		color: '#002855',
	},

	solicitudCorreo: {
		fontSize: 13,
		color: '#5e6f84',
		marginTop: 2,
	},

	solicitudActions: {
		flexDirection: 'row',
		columnGap: 10,
	},

	aceptarButton: {
		backgroundColor: '#0f766e',
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 8,
	},

	aceptarButtonText: {
		color: '#fff',
		fontWeight: '600',
	},

	rechazarButton: {
		backgroundColor: '#b91c1c',
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 8,
	},

	rechazarButtonText: {
		color: '#fff',
		fontWeight: '600',
	},

	card: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 18,
		marginBottom: 16,
		shadowColor: '#002855',
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 3,
		borderWidth: 1,
		borderColor: '#e0e7ef',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},

	infoContainer: {
		flex: 1,
		marginRight: 12,
	},

	name: {
		fontWeight: 'bold',
		fontSize: 17,
		color: '#002855',
		marginBottom: 2,
	},

	email: {
		color: '#666',
		fontSize: 15,
	},

	messageButton: {
		backgroundColor: '#002855',
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 8,
	},

	messageButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 14,
	},

	footer: {
		width: '100%',
		backgroundColor: '#002855',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 24,
		paddingHorizontal: 20,
		paddingBottom: 44,
		paddingTop: 24,
		minHeight: 80,
	},

	footerText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 20,
	},
});
