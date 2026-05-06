import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	Pressable,
	ScrollView,
	Text,
	View,
	useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import io, { Socket } from 'socket.io-client';
import { PrimaryButton, Screen } from '@uniconnect/ui';
import theme from '../styles/theme';
import { styles } from '../styles/EventosScreen.styles';
import { apiClient } from '../services';
import { CrearEventoModal } from '../components/CrearEventoModal';
import { resolverApiBaseUrl } from '../utils/apiConfig';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { styles as principalStyles } from '../styles/PrincipalScreenStyles';
import { authService } from '../services';
import { showToast } from '../utils/toast';

const SUSCRIPCIONES_KEY = '@uniconnect_suscripciones_categorias';

// --- Tipos ---
type RootStackParamList = {
	Principal: undefined;
	Eventos: undefined;
	Grupos: undefined;
	Contactos: undefined;
	Notificaciones: undefined;
	EditarPerfil: undefined;
	Login: undefined;
};

type EventosScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Eventos'>;

// Exportamos el tipo para poder usarlo en el Modal
export type CategoriaEvento = 'academico' | 'cultural' | 'deportivo' | 'otro';

const CATEGORIAS: { value: CategoriaEvento | 'todas'; label: string }[] = [
	{ value: 'todas', label: 'Todas' },
	{ value: 'academico', label: 'Académico' },
	{ value: 'cultural', label: 'Cultural' },
	{ value: 'deportivo', label: 'Deportivo' },
	{ value: 'otro', label: 'Otro' },
];

type Evento = {
	id: string;
	titulo: string;
	descripcion: string;
	lugar?: string | null;
	fechaEvento: string;
	categoria: CategoriaEvento;
	creador: {
		id: string;
		nombre: string;
		apellido: string;
		correo: string;
	};
};

type EventosScreenProps = {
	navigation: EventosScreenNavigationProp;
};

// --- Utilidades ---
function formatearFechaEvento(fechaIso: string): string {
	const fecha = new Date(fechaIso);
	if (Number.isNaN(fecha.getTime())) return 'Fecha inválida';

	return new Intl.DateTimeFormat('es-CO', {
		dateStyle: 'full',
		timeStyle: 'short',
	}).format(fecha);
}

function badgeCategoria(cat: CategoriaEvento): string {
	const map: Record<CategoriaEvento, string> = {
		academico: 'Académico',
		cultural: 'Cultural',
		deportivo: 'Deportivo',
		otro: 'Otro',
	};
	return map[cat] ?? cat;
}

// --- Componente Principal ---
export function EventosScreen({ navigation }: EventosScreenProps) {
	const [eventos, setEventos] = useState<Evento[]>([]);
	const [loadingEventos, setLoadingEventos] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [crearEventoModalVisible, setCrearEventoModalVisible] = useState(false);
	const [filtroActivo, setFiltroActivo] = useState<CategoriaEvento | 'todas'>('todas');
	const [categoriasSuscritas, setCategoriasSuscritas] = useState<Set<CategoriaEvento>>(
		new Set()
	);
	const [notificacionObserver, setNotificacionObserver] = useState<string | null>(null);

	const socketRef = useRef<Socket | null>(null);
	const apiBaseUrl = resolverApiBaseUrl(); // <-- ¡Usando la función importada!
	const isDesktop = useIsDesktop();
	const unreadNotifications = useUnreadNotifications();
	const { width } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;

	const handleLogout = async () => {
		try {
			await authService.logout();
			navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
		} catch {
			showToast.error('Error al cerrar sesión');
		}
	};

	const cargarEventos = useCallback(async (categoria?: CategoriaEvento | 'todas') => {
		try {
			const url =
				categoria && categoria !== 'todas'
					? `/api/eventos?categoria=${categoria}`
					: '/api/eventos';

			const response = await apiClient.get<Evento[]>(url);
			setEventos(response.data ?? []);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
		} finally {
			setLoadingEventos(false);
		}
	}, []);

	// Carga y re-registra suscripciones al montar la pantalla
	useEffect(() => {
		let isMounted = true;

		const cargarSuscripciones = async () => {
			try {
				const raw = await AsyncStorage.getItem(SUSCRIPCIONES_KEY);
				const almacenadas: CategoriaEvento[] = raw ? JSON.parse(raw) : [];
				if (!isMounted || almacenadas.length === 0) return;

				setCategoriasSuscritas(new Set(almacenadas));

				// Re-registra con el backend por si el servidor reinició
				await Promise.all(
					almacenadas.map((cat) =>
						apiClient
							.post('/api/eventos/suscripciones', { categoria: cat })
							.catch(() => {})
					)
				);
			} catch {
				// silencioso
			}
		};

		cargarSuscripciones();
		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		let isMounted = true;

		const inicializar = async () => {
			try {
				const tokenActivo = await apiClient.getToken();
				if (isMounted && tokenActivo) {
					setLoadingEventos(true);

					socketRef.current = io(apiBaseUrl, {
						auth: { token: tokenActivo },
						transports: ['websocket'],
					});

					socketRef.current.on('evento:nuevo:categoria', (evento: Evento) => {
						setNotificacionObserver(
							`Nuevo evento "${evento.titulo}" en categoría ${badgeCategoria(evento.categoria)}`
						);
						setTimeout(() => setNotificacionObserver(null), 5000);
					});

					await cargarEventos(filtroActivo);
				} else if (isMounted) {
					setError('No hay sesión activa. Inicia sesión para ver eventos.');
					setLoadingEventos(false);
				}
			} catch {
				if (isMounted) {
					setError('Error al inicializar la pantalla.');
					setLoadingEventos(false);
				}
			}
		};

		inicializar();
		return () => {
			isMounted = false;
			socketRef.current?.disconnect();
		};
	}, [apiBaseUrl, cargarEventos, filtroActivo]);

	const aplicarFiltro = async (cat: CategoriaEvento | 'todas') => {
		setFiltroActivo(cat);
		setLoadingEventos(true);
		await cargarEventos(cat);
	};

	const toggleSuscripcion = async (categoria: CategoriaEvento) => {
		const estaSuscrito = categoriasSuscritas.has(categoria);
		try {
			if (estaSuscrito) {
				await apiClient.delete(`/api/eventos/suscripciones/${categoria}`);
			} else {
				await apiClient.post(`/api/eventos/suscripciones`, { categoria });
			}

			const next = new Set(categoriasSuscritas);
			estaSuscrito ? next.delete(categoria) : next.add(categoria);
			setCategoriasSuscritas(next);

			await AsyncStorage.setItem(SUSCRIPCIONES_KEY, JSON.stringify(Array.from(next)));

			showToast.success(
				estaSuscrito
					? `Desuscrito de eventos ${badgeCategoria(categoria)}`
					: `Suscrito a eventos ${badgeCategoria(categoria)}`
			);
		} catch {
			showToast.error('No se pudo actualizar la suscripción');
		}
	};

	const handleEventoSuccess = async () => {
		await cargarEventos(filtroActivo);
	};

	return (
		<DesktopSidebar navigation={navigation} activeScreen="Eventos">
			<Screen style={styles.container}>
				{!isDesktop && (
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
								<View style={{ position: 'relative' }}>
									<Ionicons name="notifications-outline" size={32} color="#007AFF" />
									{unreadNotifications > 0 && (
										<View
											style={{
												position: 'absolute',
												top: -2,
												right: -4,
												backgroundColor: '#E53935',
												borderRadius: 10,
												minWidth: 18,
												height: 18,
												justifyContent: 'center',
												alignItems: 'center',
												paddingHorizontal: 3,
											}}
										>
											<Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
												{unreadNotifications > 99 ? '99+' : unreadNotifications}
											</Text>
										</View>
									)}
								</View>
							</Pressable>
						</View>

						<View style={principalStyles.headerRight}>
							<PrimaryButton style={principalStyles.logoutButton} onPress={handleLogout}>
								<Text style={principalStyles.logoutText}>Salir</Text>
								<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
							</PrimaryButton>
						</View>
					</View>
				)}

				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.contentWrapper}
					showsVerticalScrollIndicator={true}
				>
					<View
						style={{
							width: '100%',
							paddingHorizontal: 16,
							paddingTop: 16,
							paddingBottom: 8,
						}}
					>
						<Text style={principalStyles.greeting}>Eventos</Text>
						<Text style={principalStyles.subtitle}>Comunidad Universidad de Caldas</Text>
					</View>

					{notificacionObserver && (
						<View style={styles.observerBanner}>
							<Text style={styles.observerBannerText}>🔔 {notificacionObserver}</Text>
						</View>
					)}

					<View style={styles.formCard}>
						<Text style={styles.formTitle}>Publicar evento</Text>
						<PrimaryButton
							style={styles.createButton}
							onPress={() => setCrearEventoModalVisible(true)}
						>
							<Text style={styles.createButtonText}>+ Crear</Text>
						</PrimaryButton>
					</View>

					<View style={styles.filtroSection}>
						<Text style={styles.filtroLabel}>Filtrar por categoría</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.chipScroll}
						>
							{CATEGORIAS.map((cat) => (
								<Pressable
									key={cat.value}
									onPress={() => aplicarFiltro(cat.value)}
									style={[styles.chip, filtroActivo === cat.value && styles.chipActivo]}
								>
									<Text
										style={[
											styles.chipText,
											filtroActivo === cat.value && styles.chipTextoActivo,
										]}
									>
										{cat.label}
									</Text>
								</Pressable>
							))}
						</ScrollView>

						{filtroActivo !== 'todas' && (
							<View style={styles.suscripcionRow}>
								<Text style={styles.suscripcionLabel}>
									{categoriasSuscritas.has(filtroActivo as CategoriaEvento)
										? '✓ Suscrito a esta categoría'
										: 'Recibir notificaciones de esta categoría'}
								</Text>
								<Pressable
									onPress={() => toggleSuscripcion(filtroActivo as CategoriaEvento)}
									style={[
										styles.suscripcionBtn,
										categoriasSuscritas.has(filtroActivo as CategoriaEvento) &&
											styles.suscripcionBtnActivo,
									]}
								>
									<Text style={styles.suscripcionBtnText}>
										{categoriasSuscritas.has(filtroActivo as CategoriaEvento)
											? 'Desuscribirse'
											: 'Suscribirse'}
									</Text>
								</Pressable>
							</View>
						)}
					</View>

					{loadingEventos && (
						<ActivityIndicator color={theme.colors.primary} size="large" />
					)}
					{error && <Text style={styles.error}>Error: {error}</Text>}

					{!loadingEventos && !error && (
						<View style={styles.list}>
							{eventos.map((evento) => (
								<View key={evento.id} style={styles.card}>
									<View style={styles.cardHeader}>
										<Text style={styles.eventTitle}>{evento.titulo}</Text>
										<View style={styles.categoriaBadge}>
											<Text style={styles.categoriaBadgeText}>
												{badgeCategoria(evento.categoria)}
											</Text>
										</View>
									</View>
									<Text style={styles.eventDate}>
										{formatearFechaEvento(evento.fechaEvento)}
									</Text>
									<Text style={styles.eventDescription}>{evento.descripcion}</Text>
									<Text style={styles.eventLocation}>
										Lugar: {evento.lugar?.trim() || 'Por definir'}
									</Text>
									<Text style={styles.eventAuthor}>
										Organiza: {evento.creador.nombre} {evento.creador.apellido}
									</Text>
								</View>
							))}
							{eventos.length === 0 && (
								<Text style={styles.empty}>No hay eventos próximos en este momento.</Text>
							)}
						</View>
					)}
				</ScrollView>

				{!isDesktop && (
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
							style={[styles.footerTab, styles.footerTabActive]}
							onPress={() => navigation.navigate('Eventos')}
							accessibilityLabel="Eventos"
						>
							<Ionicons name="calendar" size={24} style={styles.footerIcon} />
						</Pressable>

						<Pressable
							style={styles.footerTab}
							onPress={() => navigation.navigate('Contactos')}
							accessibilityLabel="Contactos"
						>
							<Ionicons name="chatbubbles-outline" size={24} style={styles.footerIcon} />
						</Pressable>
					</View>
				)}

				<CrearEventoModal
					visible={crearEventoModalVisible}
					onClose={() => setCrearEventoModalVisible(false)}
					onSuccess={handleEventoSuccess}
				/>
			</Screen>
		</DesktopSidebar>
	);
}
