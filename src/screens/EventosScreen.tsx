import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import io, { Socket } from 'socket.io-client';
import theme from '../styles/theme';
import { styles } from '../styles/EventosScreen.styles';
import { apiClient } from '../services';
import { CrearEventoModal } from '../components/CrearEventoModal';
import { resolverApiBaseUrl } from '../utils/apiConfig';
import { DesktopSidebar } from '../components/DesktopSidebar';

// --- Tipos ---
type RootStackParamList = {
	Principal: undefined;
	Eventos: undefined;
	Grupos: undefined;
	Contactos: undefined;
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

			setCategoriasSuscritas((prev) => {
				const next = new Set(prev);
				estaSuscrito ? next.delete(categoria) : next.add(categoria);
				return next;
			});
		} catch {
			// silencioso
		}
	};

	const handleEventoSuccess = async () => {
		await cargarEventos(filtroActivo);
	};

	return (
		<DesktopSidebar navigation={navigation} activeScreen="Eventos">
		<View style={styles.container}>
			<View style={styles.contentWrapper}>
				<View style={styles.headerWithButton}>
					<View style={styles.headerText}>
						<Text style={styles.title}>UniConnect</Text>
						<Text style={styles.subtitle}>Eventos</Text>
						<Text style={styles.caption}>Comunidad Universidad de Caldas</Text>
					</View>
				</View>

				{notificacionObserver && (
					<View style={styles.observerBanner}>
						<Text style={styles.observerBannerText}>🔔 {notificacionObserver}</Text>
					</View>
				)}

				<View style={styles.formCard}>
					<Text style={styles.formTitle}>Publicar evento</Text>
					<Pressable
						style={styles.createButton}
						onPress={() => setCrearEventoModalVisible(true)}
					>
						<Text style={styles.createButtonText}>+ Crear</Text>
					</Pressable>
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
					<ScrollView contentContainerStyle={styles.list} style={styles.scrollView}>
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
					</ScrollView>
				)}
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

			<CrearEventoModal
				visible={crearEventoModalVisible}
				onClose={() => setCrearEventoModalVisible(false)}
				onSuccess={handleEventoSuccess}
			/>
		</View>
		</DesktopSidebar>
	);
}
