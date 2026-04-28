import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
	View,
	Text,
	Image,
	FlatList,
	ListRenderItem,
	Pressable,
	Alert,
	useWindowDimensions,
	TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService, usuariosService } from '../services';
import { showToast } from '../utils/toast';
import { clearUnreadContactRequestNotification } from '../services/notificaciones-solicitudes.service';
import { styles as principalStyles } from '../styles/PrincipalScreenStyles';
import type { Usuario } from '../types/api.types';

// Importamos los estilos separados
import { styles } from '../styles/ContactScreen.styles';
import { DesktopSidebar } from '../components/DesktopSidebar';

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
	const { width } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;

	const [contactos, setContactos] = useState<Contacto[]>([]);
	const [solicitudesPendientes, setSolicitudesPendientes] = useState<
		SolicitudPendiente[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [processingSolicitudId, setProcessingSolicitudId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Usuario[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [sendingSolicitudTo, setSendingSolicitudTo] = useState<string | null>(null);
	const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null);
	const [contactosIds, setContactosIds] = useState<Set<string>>(new Set());

	const cargarDatos = async () => {
		setLoading(true);
		setError(null);

		try {
			const [usuarioActual, contactosResult, solicitudesResult] =
				await Promise.allSettled([
					authService.obtenerIdUsuarioActual(),
					usuariosService.getCompaneros(),
					usuariosService.getSolicitudesRecibidas(),
				]);

			let errorCompaneros: string | null = null;
			let errorSolicitudes: string | null = null;

			if (usuarioActual.status === 'fulfilled') {
				setUsuarioActualId(usuarioActual.value);
			}

			if (contactosResult.status === 'fulfilled') {
				setContactos(contactosResult.value);
				// Crear un Set con los IDs para búsqueda rápida
				const ids = new Set(contactosResult.value.map((c) => c.id));
				setContactosIds(ids);
			} else {
				setContactos([]);
				errorCompaneros =
					contactosResult.reason instanceof Error
						? contactosResult.reason.message
						: 'No fue posible cargar compañeros';
			}

			if (solicitudesResult.status === 'fulfilled') {
				setSolicitudesPendientes(solicitudesResult.value);
			} else {
				setSolicitudesPendientes([]);
				errorSolicitudes =
					solicitudesResult.reason instanceof Error
						? solicitudesResult.reason.message
						: 'No fue posible cargar solicitudes';
			}

			if (errorCompaneros || errorSolicitudes) {
				const mensaje = [errorCompaneros, errorSolicitudes]
					.filter((m): m is string => Boolean(m))
					.join(' | ');
				setError(mensaje || 'Error al cargar contactos');
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Error al cargar contactos');
		}

		setLoading(false);
	};

	useEffect(() => {
		void cargarDatos();
	}, []);

	const handleLogout = async () => {
		try {
			await authService.logout();
			navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
		} catch {
			showToast.error('Error al cerrar sesion');
		}
	};

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

			await clearUnreadContactRequestNotification(solicitudId);

			setSolicitudesPendientes((prev) =>
				prev.filter((s) => s.solicitudId !== solicitudId)
			);

			if (action === 'aceptar') {
				await cargarDatos();
			}
		} catch (_e) {
			Alert.alert('Error de red', 'No fue posible procesar la solicitud.');
		} finally {
			setProcessingSolicitudId(null);
		}
	};

	const handleSearch = async (query: string) => {
		setSearchQuery(query);

		if (!query.trim()) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		try {
			let results = await usuariosService.buscarUsuarios(query);
			results = results.filter((usuario) => usuario.id !== usuarioActualId);
			setSearchResults(results);
		} catch (e) {
			setSearchResults([]);
			showToast.error('Error al buscar usuarios');
		} finally {
			setIsSearching(false);
		}
	};

	const handleEnviarSolicitud = async (usuarioId: string) => {
		setSendingSolicitudTo(usuarioId);
		try {
			await usuariosService.enviarSolicitud(usuarioId);
			showToast.success('Solicitud de amistad enviada');
			setSearchQuery('');
			setSearchResults([]);
		} catch (e) {
			showToast.error('No fue posible enviar la solicitud');
		} finally {
			setSendingSolicitudTo(null);
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

	const renderSearchResult: ListRenderItem<Usuario> = ({ item }) => {
		const esContacto = contactosIds.has(item.id);

		return (
			<View style={styles.searchResultCard}>
				<View style={styles.infoContainer}>
					<Text style={styles.name}>{item.nombre || 'Nombre no disponible'}</Text>
					<Text style={styles.email}>{item.correo || 'Correo no disponible'}</Text>
				</View>
				<View style={styles.searchResultActions}>
					<Pressable
						style={({ pressed }) => [
							styles.searchResultMessageButton,
							pressed && { opacity: 0.8 },
						]}
						onPress={() => {
							if (item.id) {
								navigation.navigate('MensajeDirecto', {
									contactoId: item.id,
									nombre: item.nombre,
									correo: item.correo,
								});
							} else {
								Alert.alert('Error', 'No se pudo obtener el ID del usuario');
							}
						}}
					>
						<Ionicons name="chatbubble-outline" size={16} color="#fff" />
						<Text style={styles.searchResultMessageButtonText}>Mensaje</Text>
					</Pressable>
					{!esContacto && (
						<Pressable
							style={({ pressed }) => [
								styles.addButton,
								pressed && { opacity: 0.8 },
								sendingSolicitudTo === item.id && { opacity: 0.5 },
							]}
							disabled={sendingSolicitudTo === item.id}
							onPress={() => handleEnviarSolicitud(item.id)}
						>
							<Ionicons name="person-add-outline" size={16} color="#fff" />
							<Text style={styles.addButtonText}>Agregar</Text>
						</Pressable>
					)}
				</View>
			</View>
		);
	};

	return (
		<DesktopSidebar navigation={navigation} activeScreen="Contactos">
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
				<Text style={principalStyles.greeting}>Contactos</Text>
				<Text style={principalStyles.subtitle}>
					Aqui podras ver y gestionar tus contactos de UniConnect.
				</Text>

				{/* Search Bar */}
				<View style={styles.searchContainer}>
					<Ionicons
						name="search-outline"
						size={20}
						color="#64748b"
						style={styles.searchIcon}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder="Buscar compañeros..."
						placeholderTextColor="#b1bcc8"
						value={searchQuery}
						onChangeText={handleSearch}
					/>
					{searchQuery !== '' && (
						<Pressable
							onPress={() => {
								setSearchQuery('');
								setSearchResults([]);
							}}
						>
							<Ionicons name="close-outline" size={20} color="#64748b" />
						</Pressable>
					)}
				</View>

				{/* Search Results */}
				{searchQuery !== '' && (
					<View style={styles.searchResultsContainer}>
						{isSearching ? (
							<Text style={styles.centerText}>Buscando...</Text>
						) : searchResults.length > 0 ? (
							<FlatList<Usuario>
								data={searchResults}
								keyExtractor={(item) => item.id}
								renderItem={renderSearchResult}
								scrollEnabled={false}
								contentContainerStyle={styles.searchResultsList}
							/>
						) : (
							<Text style={styles.centerText}>No se encontraron compañeros</Text>
						)}
					</View>
				)}

				{loading ? (
					<Text style={styles.centerText}>Cargando contactos...</Text>
				) : error ? (
					<Text style={[styles.centerText, { color: 'red' }]}>{error}</Text>
				) : (
					<FlatList<Contacto>
						data={contactos}
						keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
						renderItem={renderItem}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.listContent}
						ListHeaderComponent={
							<View style={styles.screenHeader}>
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

			<View style={principalStyles.bottomBar}>
				<Pressable
					style={principalStyles.footerTab}
					onPress={() => navigation.navigate('Principal')}
					accessibilityLabel="Inicio"
				>
					<Ionicons name="home-outline" size={24} style={principalStyles.footerIcon} />
				</Pressable>

				<Pressable
					style={principalStyles.footerTab}
					onPress={() => navigation.navigate('Grupos')}
					accessibilityLabel="Grupos"
				>
					<Ionicons name="people-outline" size={24} style={principalStyles.footerIcon} />
				</Pressable>

				<Pressable
					style={principalStyles.footerTab}
					onPress={() => navigation.navigate('Eventos')}
					accessibilityLabel="Eventos"
				>
					<Ionicons
						name="calendar-outline"
						size={24}
						style={principalStyles.footerIcon}
					/>
				</Pressable>

				<Pressable
					style={[principalStyles.footerTab, principalStyles.footerTabActive]}
					onPress={() => navigation.navigate('Contactos')}
					accessibilityLabel="Contactos"
				>
					<Ionicons name="chatbubbles" size={24} style={principalStyles.footerIcon} />
				</Pressable>
			</View>
		</View>
		</DesktopSidebar>
	);
}
