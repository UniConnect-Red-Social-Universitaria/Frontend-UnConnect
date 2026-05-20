import React, { useEffect, useState } from 'react';
import {
	View,
	Text as RNText,
	Pressable,
	TextInput,
	ActivityIndicator,
	ScrollView,
	Image,
	Modal,
	useWindowDimensions,
} from 'react-native';
import { PrimaryButton, Screen, Text, Title } from '@uniconnect/ui';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useIsDesktop } from '../hooks/useIsDesktop';
import globalStyles from '../styles/global';
import { styles } from '../styles/PrincipalScreenStyles';
import {
	authService,
	usuariosService,
	materiasService,
	onboardingService,
} from '../services';
// ...existing code...
import { showToast } from '../utils/toast';
import {
	getUnreadNotificationsCount,
	subscribeUnreadNotificationsCount,
} from '../services/notificaciones-badge.service';
import { subscribeContactRequestRejectionSeen } from '../services/contacto-events.service';

type RootStackParamList = {
	Principal: undefined;
	Grupos: undefined;
	Eventos: undefined;
	Contactos: undefined;
	EditarPerfil: undefined;
	Notificaciones: undefined;
	SesionesEstudio: undefined;
	Sprints: undefined;
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
	const { width, height } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;
	const isDesktop = useIsDesktop();

	const [search, setSearch] = useState('');
	const [materiaResults, setMateriaResults] = useState<any[]>([]);
	const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
	const [companerosResults, setCompanerosResults] = useState<any[]>([]);
	const [loadingCompaneros, setLoadingCompaneros] = useState(false);
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
		void authService.obtenerIdUsuarioActual().then((id) => {
			setCurrentUserId(id);
		});
	}, []);

	useEffect(() => {
		let isMounted = true;

		const loadOnboardingState = async () => {
			try {
				const shouldShow = await onboardingService.shouldShowPrincipalOnboarding();
				if (isMounted) {
					setShowOnboarding(shouldShow);
				}
			} catch (error) {
				console.warn(
					'[PrincipalScreen] Error verificando onboarding:',
					error instanceof Error ? error.message : error
				);
			}
		};

		void loadOnboardingState();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		const unsubscribe = subscribeContactRequestRejectionSeen((payload) => {
			const receptorId = String(payload?.receptorId ?? '').trim();
			if (!receptorId) {
				return;
			}

			setSolicitudesEnviadasIds((prev) => {
				if (!prev.has(receptorId)) {
					return prev;
				}

				const next = new Set(prev);
				next.delete(receptorId);
				return next;
			});

			setSendingRequestIds((prev) => {
				if (!prev.has(receptorId)) {
					return prev;
				}

				const next = new Set(prev);
				next.delete(receptorId);
				return next;
			});
		});

		return unsubscribe;
	}, []);

	useEffect(() => {
		let ignore = false;

		const buscarMaterias = async () => {
			try {
				const materias = await materiasService.buscarMaterias(search);
				if (!ignore) {
					setMateriaResults(materias);
				}
			} catch {
				if (!ignore) {
					setMateriaResults([]);
				}
			}
		};

		if (!search.trim() || selectedMateria) {
			setMateriaResults([]);
			return;
		}

		const timeoutId = setTimeout(() => {
			buscarMaterias();
		}, 300);

		return () => {
			ignore = true;
			clearTimeout(timeoutId);
		};
	}, [search, selectedMateria]);

	const handleSeleccionarMateria = async (nombre: string) => {
		setSelectedMateria(nombre);
		setSearch('');
		setMateriaResults([]);
		setLoadingCompaneros(true);
		try {
			const companeros = await usuariosService.buscarPorMateria(nombre);
			setCompanerosResults(Array.isArray(companeros) ? companeros : []);
		} catch {
			setCompanerosResults([]);
		} finally {
			setLoadingCompaneros(false);
		}
	};

	const handleVolverAMaterias = () => {
		setSelectedMateria(null);
		setCompanerosResults([]);
	};
	// ...existing code...

	const cargarContactos = React.useCallback(async () => {
		try {
			const contactos = await usuariosService.getCompaneros();
			setContactIds(new Set(contactos.map((contacto) => String(contacto.id))));
		} catch {
			setContactIds(new Set());
		}
	}, []);

	const handleEnviarSolicitud = async (usuarioDestinoId: string, nombre?: string) => {
		if (!usuarioDestinoId) {
			return;
		}

		setSendingRequestIds((prev) => {
			const next = new Set(prev);
			next.add(usuarioDestinoId);
			return next;
		});

		try {
			await usuariosService.enviarSolicitud(usuarioDestinoId);
			setSolicitudesEnviadasIds((prev) => {
				const next = new Set(prev);
				next.add(usuarioDestinoId);
				return next;
			});
			showToast.success(
				nombre ? `Solicitud enviada a ${nombre}` : 'Solicitud enviada correctamente'
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'No se pudo enviar la solicitud';

			if (message.toLowerCase().includes('ya existe')) {
				setSolicitudesEnviadasIds((prev) => {
					const next = new Set(prev);
					next.add(usuarioDestinoId);
					return next;
				});
				showToast.info('Ya existe una solicitud pendiente para este usuario');
			} else {
				showToast.error(message);
			}
		} finally {
			setSendingRequestIds((prev) => {
				const next = new Set(prev);
				next.delete(usuarioDestinoId);
				return next;
			});
		}
	};

	useFocusEffect(
		React.useCallback(() => {
			let mounted = true;

			void getUnreadNotificationsCount().then((count) => {
				if (mounted) {
					setUnreadNotifications(count);
				}
			});

			void cargarContactos();

			const unsubscribe = subscribeUnreadNotificationsCount((count) => {
				if (mounted) {
					setUnreadNotifications(count);
				}
			});

			return () => {
				mounted = false;
				unsubscribe();
			};
		}, [cargarContactos])
	);

	const handleCloseOnboarding = async () => {
		setShowOnboarding(false);
		setCurrentOnboardingStep(0);
		try {
			await onboardingService.completePrincipalOnboarding();
		} catch (error) {
			console.warn(
				'[PrincipalScreen] Error cerrando onboarding:',
				error instanceof Error ? error.message : error
			);
		}
	};

	const handleNextOnboardingStep = async () => {
		if (currentOnboardingStep >= onboardingSteps.length - 1) {
			await handleCloseOnboarding();
			return;
		}

		setCurrentOnboardingStep((prev) => prev + 1);
	};

	if (loading) {
		return (
			<Screen style={{ justifyContent: 'center' }}>
				<ActivityIndicator size="large" />
			</Screen>
		);
	}

	const mainContent = (
		<>
			<Title style={styles.greeting}>¡Hola!</Title>
			<Text style={styles.subtitle}>Encuentra tu comunidad en la universidad</Text>

			{!selectedMateria ? (
				<>
					<Pressable
						onPress={() => navigation.navigate('Sprints')}
						style={{
							flexDirection: 'row', alignItems: 'center', gap: 12,
							backgroundColor: '#fff', borderRadius: 14, padding: 14,
							marginBottom: 14, borderWidth: 2, borderColor: '#003e70',
						}}
					>
						<Ionicons name="stats-chart" size={28} color="#003e70" />
						<View style={{ flex: 1 }}>
							<RNText style={{ fontSize: 15, fontWeight: '700', color: '#003e70' }}>
								Scrum — Tablero de Sprints
							</RNText>
							<RNText style={{ fontSize: 12, color: '#7a9ab5' }}>
								Gestiona sprints, historias y métricas
							</RNText>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#003e70" />
					</Pressable>

					<View
						style={[
							styles.searchContainer,
							isSearchStep && styles.onboardingHighlightedPrimaryElement,
						]}
					>
						<TextInput
							placeholder="Buscar materia..."
							placeholderTextColor="#999"
							style={styles.searchInput}
							value={search}
							onChangeText={setSearch}
						/>
					</View>

					<ScrollView style={{ marginTop: 10 }}>
						{materiaResults.length > 0 && (
							<>
								<Text style={styles.resultsTitle}>Materias</Text>
								{materiaResults.map((item) => (
									<Pressable
										key={item.id || item._id}
										style={styles.userResultCard}
										onPress={() => void handleSeleccionarMateria(item.nombre)}
									>
										<View style={styles.userResultInfo}>
											<Text style={styles.userResultName}>{item.nombre}</Text>
										</View>
										<Ionicons name="chevron-forward" size={20} color="#007AFF" />
									</Pressable>
								))}
							</>
						)}

						{materiaResults.length === 0 && search.trim() !== '' && (
							<Text style={{ color: '#CCC', marginTop: 10 }}>
								No se encontraron materias.
							</Text>
						)}
					</ScrollView>
				</>
			) : (
				<>
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
						<Pressable onPress={handleVolverAMaterias} style={{ marginRight: 8 }}>
							<Ionicons name="arrow-back" size={24} color="#007AFF" />
						</Pressable>
						<Text style={styles.resultsTitle}>{selectedMateria}</Text>
					</View>

					{loadingCompaneros ? (
						<ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 20 }} />
					) : (
						<ScrollView style={{ marginTop: 4 }}>
							{companerosResults.length > 0 ? (
								companerosResults.map((item) => (
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
												<PrimaryButton
													style={[
														styles.sendRequestButton,
														(solicitudEnviada || solicitudEnProceso) &&
															styles.sendRequestButtonDisabled,
													]}
													disabled={solicitudEnviada || solicitudEnProceso}
													onPress={() =>
														void handleEnviarSolicitud(usuarioId, item.nombre)
													}
												>
													<RNText style={styles.sendRequestButtonText}>
														{solicitudEnProceso
															? 'Enviando...'
															: solicitudEnviada
																? 'Enviada'
																: 'Enviar solicitud'}
													</RNText>
												</PrimaryButton>
											);
										})()}
									</View>
								))
							) : (
								<Text style={{ color: '#CCC', marginTop: 10 }}>
									No hay compañeros en esta materia.
								</Text>
							)}
						</ScrollView>
					)}
				</>
			)}
		</>
	);

	if (isDesktop) {
		return (
			<Screen style={[styles.desktopContainer, { width, height }]}>
				<Modal visible={showOnboarding} transparent animationType="fade">
					<View style={styles.onboardingBackdrop}>
						<View style={styles.onboardingCard}>
							<Text style={styles.onboardingStepCounter}>
								{currentOnboardingStep + 1}/{onboardingSteps.length}
							</Text>
							<View style={styles.onboardingIconWrap}>
								<Ionicons name={currentStep.icon} size={34} color="#007AFF" />
							</View>
							<Title style={styles.onboardingTitle}>{currentStep.title}</Title>
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
									<RNText style={styles.onboardingSecondaryButtonText}>Omitir</RNText>
								</Pressable>
								<PrimaryButton
									style={styles.onboardingPrimaryButton}
									onPress={handleNextOnboardingStep}
								>
									<RNText style={styles.onboardingPrimaryButtonText}>
										{currentOnboardingStep === onboardingSteps.length - 1
											? 'Comenzar'
											: 'Siguiente'}
									</RNText>
								</PrimaryButton>
							</View>
						</View>
					</View>
				</Modal>

				{/* SIDEBAR */}
				<View style={styles.sidebar}>
					<Image
						source={require('../../assets/images/logo-caldas.png')}
						style={styles.sidebarLogo}
						resizeMode="contain"
					/>
					<Text style={styles.sidebarBrand}>UniConnect</Text>

					<View style={styles.sidebarNav}>
						<Pressable
							style={[styles.sidebarItem, styles.sidebarItemActive]}
							onPress={() => navigation.navigate('Principal')}
						>
							<Ionicons name="home" size={20} color="#007AFF" />
							<Text style={[styles.sidebarItemText, styles.sidebarItemTextActive]}>
								Inicio
							</Text>
						</Pressable>
						<Pressable
							style={styles.sidebarItem}
							onPress={() => navigation.navigate('Grupos')}
						>
							<Ionicons name="people-outline" size={20} color="#555" />
							<Text style={styles.sidebarItemText}>Grupos</Text>
						</Pressable>
						<Pressable
							style={styles.sidebarItem}
							onPress={() => navigation.navigate('Eventos')}
						>
							<Ionicons name="calendar-outline" size={20} color="#555" />
							<Text style={styles.sidebarItemText}>Eventos</Text>
						</Pressable>
						<Pressable
							style={styles.sidebarItem}
							onPress={() => navigation.navigate('SesionesEstudio')}
						>
							<Ionicons name="book-outline" size={20} color="#555" />
							<Text style={styles.sidebarItemText}>Sesiones</Text>
						</Pressable>
						<Pressable
							style={styles.sidebarItem}
							onPress={() => navigation.navigate('Contactos')}
						>
							<Ionicons name="chatbubbles-outline" size={20} color="#555" />
							<Text style={styles.sidebarItemText}>Contactos</Text>
						</Pressable>
						<Pressable
							style={styles.sidebarItem}
							onPress={() => navigation.navigate('Notificaciones')}
						>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
								<Ionicons name="notifications-outline" size={20} color="#555" />
								{unreadNotifications > 0 && (
									<View style={styles.sidebarBadge}>
										<Text style={styles.sidebarBadgeText}>
											{unreadNotifications > 99 ? '99+' : unreadNotifications}
										</Text>
									</View>
								)}
							</View>
							<Text style={styles.sidebarItemText}>Notificaciones</Text>
						</Pressable>
						<Pressable
							style={styles.sidebarItem}
							onPress={() => navigation.navigate('EditarPerfil')}
						>
							<Ionicons name="person-circle-outline" size={20} color="#555" />
							<Text style={styles.sidebarItemText}>Perfil</Text>
						</Pressable>
						<Pressable
							style={styles.sidebarItem}
							onPress={() => navigation.navigate('Sprints')}
						>
							<Ionicons name="stats-chart-outline" size={20} color="#555" />
							<Text style={styles.sidebarItemText}>Scrum</Text>
						</Pressable>
					</View>

					<PrimaryButton style={styles.sidebarLogout} onPress={handleLogout}>
						<Ionicons name="log-out-outline" size={20} color="#fff" />
						<RNText style={styles.sidebarLogoutText}>Salir</RNText>
					</PrimaryButton>
				</View>

				{/* CONTENIDO PRINCIPAL */}
				<View style={styles.desktopMain}>{mainContent}</View>
			</Screen>
		);
	}

	return (
		<Screen style={[styles.container, { width, height }]}>
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
						<Title style={styles.onboardingTitle}>{currentStep.title}</Title>
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
								<RNText style={styles.onboardingSecondaryButtonText}>Omitir</RNText>
							</Pressable>
							<PrimaryButton
								style={styles.onboardingPrimaryButton}
								onPress={handleNextOnboardingStep}
							>
								<RNText style={styles.onboardingPrimaryButtonText}>
									{currentOnboardingStep === onboardingSteps.length - 1
										? 'Comenzar'
										: 'Siguiente'}
								</RNText>
							</PrimaryButton>
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
							{unreadNotifications > 0 && (
								<View style={styles.notificationBadgeDot}>
									<Text style={styles.notificationBadgeText}>
										{unreadNotifications > 99 ? '99+' : unreadNotifications}
									</Text>
								</View>
							)}
						</View>
					</Pressable>
				</View>

				<View style={styles.headerRight}>
					<PrimaryButton
						style={[
							styles.logoutButton,
							isLogoutStep && styles.onboardingHighlightedPrimaryElement,
						]}
						onPress={handleLogout}
					>
						<RNText style={styles.logoutText}>Salir</RNText>
						<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
					</PrimaryButton>
				</View>
			</View>

			{/* MAIN */}
			<View style={styles.mainContent}>{mainContent}</View>

			{/* FOOTER */}
			<View
				style={[styles.bottomBar, isBottomBarStep && styles.onboardingHighlightedBar]}
			>
				<Pressable
					style={[styles.footerTab, styles.footerTabActive]}
					onPress={() => navigation.navigate('Principal')}
					accessibilityLabel="Inicio"
				>
					<Ionicons name="home" size={24} style={styles.footerIcon} />
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
			<Pressable
				style={styles.footerTab}
				onPress={() => navigation.navigate('Sprints')}
				accessibilityLabel="Scrum"
			>
				<Ionicons name="stats-chart-outline" size={24} style={styles.footerIcon} />
			</Pressable>
		</View>
		</Screen>
	);
}
