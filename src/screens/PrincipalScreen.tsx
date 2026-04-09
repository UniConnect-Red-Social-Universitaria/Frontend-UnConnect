import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	Pressable,
	TextInput,
	ActivityIndicator,
	ScrollView,
	Image,
	Modal,
	useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../styles/global';
import { styles } from '../styles/PrincipalScreenStyles';
import {
	authService,
	usuariosService,
	gruposService,
	materiasService,
	onboardingService,
	apiClient,
} from '../services';
// ...existing code...
import { showToast } from '../utils/toast';
import {
	getUnreadNotificationsCount,
	subscribeUnreadNotificationsCount,
} from '../services/notificaciones-badge.service';

type RootStackParamList = {
	Principal: undefined;
	Grupos: undefined;
	Eventos: undefined;
	Contactos: undefined;
	EditarPerfil: undefined;
	Notificaciones: undefined;
	Login: undefined;
	Home: undefined;
};

type PrincipalScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Principal'>;

const onboardingSteps = [
	{
		icon: 'sparkles-outline' as const,
		title: 'Bienvenido 👋',
		description:
			'Encuentra tu comunidad dentro de la universidad: conecta con estudiantes, grupos y materias en un solo lugar.',
		cardPlacement: 'center' as const,
	},
	{
		icon: 'search-outline' as const,
		title: 'Busca facilmente',
		description:
			'Encuentra usuarios, grupos o materias escribiendo en la barra de busqueda.',
		cardPlacement: 'bottom' as const,
	},
	{
		icon: 'notifications-outline' as const,
		title: 'Mantente conectado',
		description: 'Edita tu perfil y revisa tus notificaciones en cualquier momento.',
		cardPlacement: 'bottom' as const,
	},
	{
		icon: 'grid-outline' as const,
		title: 'Explora la plataforma',
		description:
			'Navega entre grupos, eventos y contactos para descubrir todo lo que puedes hacer.',
		cardPlacement: 'top' as const,
	},
	{
		icon: 'log-out-outline' as const,
		title: 'Control total',
		description: 'Puedes cerrar sesion cuando lo necesites desde el boton Salir.',
		cardPlacement: 'bottom' as const,
	},
	{
		icon: 'rocket-outline' as const,
		title: '¡Todo listo! 🎉',
		description: 'Empieza a explorar y conecta con la U.',
		cardPlacement: 'center' as const,
	},
];

export default function PrincipalScreen({
	navigation,
}: {
	navigation: PrincipalScreenNavigationProp;
}) {
	const { width } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;

	const [search, setSearch] = useState('');
	const [results, setResults] = useState<any[]>([]);
	const [grupoResults, setGrupoResults] = useState<any[]>([]);
	const [materiaResults, setMateriaResults] = useState<any[]>([]);
	const [contactIds, setContactIds] = useState<Set<string>>(new Set());
	const [solicitudesEnviadasIds, setSolicitudesEnviadasIds] = useState<Set<string>>(
		new Set()
	);
	const [sendingRequestIds, setSendingRequestIds] = useState<Set<string>>(new Set());
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [unreadNotifications, setUnreadNotifications] = useState(0);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
	const currentStep = onboardingSteps[currentOnboardingStep];
	const isSearchStep = showOnboarding && currentOnboardingStep === 1;
	const isProfileNotificationStep = showOnboarding && currentOnboardingStep === 2;
	const isBottomBarStep = showOnboarding && currentOnboardingStep === 3;
	const isLogoutStep = showOnboarding && currentOnboardingStep === 4;

	const handleLogout = async () => {
		try {
			await authService.logout();
			navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
		} catch {
			showToast.error('Error al cerrar sesión');
		}
	};

	useEffect(() => {
		setLoading(false);
	}, []);

	useEffect(() => {
		const buscarEnBackend = async () => {
			try {
				const apiBaseUrl = resolverApiBaseUrl();
				const token = await AsyncStorage.getItem('userToken');
				const query = encodeURIComponent(search.trim());

				const [usuariosMateriasRes, gruposRes] = await Promise.all([
					fetch(`${apiBaseUrl}/api/usuarios/buscar?q=${query}`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch(`${apiBaseUrl}/api/grupos/buscar?q=${query}`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
				]);

				const [usuariosMateriasData, gruposData] = await Promise.all([
					usuariosMateriasRes.json(),
					gruposRes.json(),
				]);

				if (usuariosMateriasData.success) {
					setResults(Array.isArray(usuariosMateriasData.data?.estudiantes) ? usuariosMateriasData.data.estudiantes : []);
					setMateriaResults(Array.isArray(usuariosMateriasData.data?.materias) ? usuariosMateriasData.data.materias : []);
				} else {
					setResults([]);
					setMateriaResults([]);
				}

				if (gruposData.success) {
					setGrupoResults(Array.isArray(gruposData.data) ? gruposData.data : []);
				} else {
					setGrupoResults([]);
				}

				setResults(
					Array.isArray(usuariosMateriasData?.estudiantes)
						? usuariosMateriasData.estudiantes
						: []
				);
				setMateriaResults(
					Array.isArray(usuariosMateriasData?.materias)
						? usuariosMateriasData.materias
						: []
				);
				setGrupoResults(Array.isArray(gruposData) ? gruposData : []);
			} catch (error) {
				console.log('Error buscando en backend:', error);
				setResults([]);
				setGrupoResults([]);
				setMateriaResults([]);
			}
		};

		if (!search.trim()) {
			setResults([]);
			setGrupoResults([]);
			setMateriaResults([]);
			return;
		}

		const timeoutId = setTimeout(() => {
			buscarEnBackend();
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [search]);

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center' }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Modal visible={showOnboarding} transparent animationType="fade">
				<View
					style={[
						styles.onboardingBackdrop,
						currentStep.cardPlacement === 'top' && styles.onboardingBackdropTop,
						currentStep.cardPlacement === 'bottom' && styles.onboardingBackdropBottom,
					]}
				>
					<View style={styles.onboardingCard}>
						<Text style={styles.onboardingStepCounter}>
							{currentOnboardingStep + 1}/{onboardingSteps.length}
						</Text>
						<View style={styles.onboardingIconWrap}>
							<Ionicons name={currentStep.icon} size={34} color="#007AFF" />
						</View>
						<Text style={styles.onboardingTitle}>{currentStep.title}</Text>
						<Text style={styles.onboardingDescription}>{currentStep.description}</Text>

						<View style={styles.onboardingDotsRow}>
							{onboardingSteps.map((_, index) => (
								<View
									key={index}
									style={[
										styles.onboardingDot,
										index === currentOnboardingStep && styles.onboardingDotActive,
									]}
								/>
							))}
						</View>

						<View style={styles.onboardingActions}>
							<Pressable
								style={styles.onboardingSecondaryButton}
								onPress={handleCloseOnboarding}
							>
								<Text style={styles.onboardingSecondaryButtonText}>Omitir</Text>
							</Pressable>
							<Pressable
								style={styles.onboardingPrimaryButton}
								onPress={handleNextOnboardingStep}
							>
								<Text style={styles.onboardingPrimaryButtonText}>
									{currentOnboardingStep === onboardingSteps.length - 1
										? 'Comenzar'
										: 'Siguiente'}
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>

			{/* HEADER */}
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
						style={[
							styles.iconButton,
							isProfileNotificationStep && styles.onboardingHighlightedElement,
						]}
						onPress={() => navigation.navigate('EditarPerfil')}
					>
						<Ionicons name="person-circle-outline" size={32} color="#007AFF" />
					</Pressable>
					<Pressable
						style={[
							styles.iconButton,
							isProfileNotificationStep && styles.onboardingHighlightedElement,
						]}
						onPress={() => navigation.navigate('Notificaciones')}
					>
						<View style={styles.iconWithBadgeContainer}>
							<Ionicons name="notifications-outline" size={32} color="#007AFF" />
							{unreadNotifications > 0 && <View style={styles.notificationBadgeDot} />}
						</View>
					</Pressable>
				</View>

				<View style={styles.headerRight}>
					{/* botón salir */}
					<Pressable
						style={[
							styles.logoutButton,
							isLogoutStep && styles.onboardingHighlightedPrimaryElement,
						]}
						onPress={handleLogout}
					>
						<Text style={styles.logoutText}>Salir</Text>
						<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
					</Pressable>
				</View>
			</View>

			{/* MAIN */}
			<View style={styles.mainContent}>
				<Text style={styles.greeting}>¡Hola!</Text>
				<Text style={styles.subtitle}>Encuentra tu comunidad en la universidad</Text>

				<View
					style={[
						styles.searchContainer,
						isSearchStep && styles.onboardingHighlightedPrimaryElement,
					]}
				>
					<TextInput
						placeholder="Buscar usuarios, grupos o materias..."
						placeholderTextColor="#999"
						style={styles.searchInput}
						value={search}
						onChangeText={setSearch}
					/>
				</View>

				<ScrollView style={{ marginTop: 10 }}>
					{/* Usuarios */}
					{results.length > 0 && (
						<>
							<Text style={styles.resultsTitle}>Usuarios</Text>
							{results.map((item) => (
								<View key={item.id || item._id} style={styles.userResultCard}>
									<View style={styles.userResultInfo}>
										<Text style={styles.userResultName}>
											{item.nombre} {item.apellido}
										</Text>
										<Text style={styles.userResultEmail}>{item.correo}</Text>
									</View>
									{(() => {
										const usuarioId = String(item.id || item._id || '');
										const esUsuarioActual =
											!!currentUserId && usuarioId === currentUserId;
										const esContacto = contactIds.has(usuarioId);
										const solicitudEnviada = solicitudesEnviadasIds.has(usuarioId);
										const solicitudEnProceso = sendingRequestIds.has(usuarioId);
										const puedeEnviar =
											usuarioId.length > 0 && !esUsuarioActual && !esContacto;

										if (esContacto) {
											return (
												<View style={styles.userStatusBadge}>
													<Text style={styles.userStatusBadgeText}>Agregado</Text>
												</View>
											);
										}

										if (!puedeEnviar) {
											return null;
										}

										return (
											<Pressable
												style={[
													styles.sendRequestButton,
													(solicitudEnviada || solicitudEnProceso) &&
														styles.sendRequestButtonDisabled,
												]}
												disabled={solicitudEnviada || solicitudEnProceso}
												onPress={() => void handleEnviarSolicitud(usuarioId, item.nombre)}
											>
												<Text style={styles.sendRequestButtonText}>
													{solicitudEnProceso
														? 'Enviando...'
														: solicitudEnviada
															? 'Enviada'
															: 'Enviar solicitud'}
												</Text>
											</Pressable>
										);
									})()}
								</View>
							))}
						</>
					)}

					{/* Grupos */}
					{grupoResults.length > 0 && (
						<>
							<Text style={styles.resultsTitle}>Grupos</Text>
							{grupoResults.map((item) => (
								<View key={item.id || item._id} style={{ paddingVertical: 6 }}>
									<Text style={{ fontWeight: 'bold' }}>{item.nombre}</Text>
									<Text>Materia: {item.materia?.nombre}</Text>
								</View>
							))}
						</>
					)}

					{/* Materias */}
					{materiaResults.length > 0 && (
						<>
							<Text style={styles.resultsTitle}>Materias</Text>
							{materiaResults.map((item) => (
								<View key={item.id || item._id} style={{ paddingVertical: 6 }}>
									<Text style={{ fontWeight: 'bold' }}>{item.nombre}</Text>
								</View>
							))}
						</>
					)}

					{results.length === 0 &&
						grupoResults.length === 0 &&
						materiaResults.length === 0 &&
						search.trim() !== '' && (
							<Text style={{ color: '#CCC', marginTop: 10 }}>
								No se encontraron resultados.
							</Text>
						)}
				</ScrollView>
			</View>

			{/* FOOTER */}
			<View
				style={[styles.bottomBar, isBottomBarStep && styles.onboardingHighlightedBar]}
			>
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
