import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';
import HomeScreen from '../screens/HomeScreen';
import PrincipalScreen from '../screens/PrincipalScreen';
import { GruposScreen } from '../screens/GruposScreen';
import { EventosScreen } from '../screens/EventosScreen';
import theme from '../styles/theme';
import RegistroScreen from '../screens/RegistroScreen';
import CompletarRegistroScreen from '../screens/CompletarRegistroScreen';
import LoginScreen from '../screens/LoginScreen';
import { DetalleGrupoScreen } from '../screens/DetalleGrupoScreen';
import MensajeGrupoScreen from '../screens/MensajeGrupoScreen';
import MensajeDirectoScreen from '../screens/MensajeDirectoScreen';
import ContactScreen from '../screens/ContactScreen';
import EditarPerfilScreen from '../screens/EditarPerfilScreen';
import NotificacionesScreen from '../screens/NotificacionesScreen';
import { resolverApiBaseUrl } from '../utils/apiConfig';
import { authService } from '../services';
import { notifyIncomingMessage } from '../services/notificaciones.service';
import { incrementUnreadNotificationsCount } from '../services/notificaciones-badge.service';
import { upsertUnreadDirectChatNotification } from '../services/notificaciones-chat.service';

export type RootStackParamList = {
	Home: undefined;
	Principal: undefined;
	Grupos: undefined;
	Eventos: undefined;
	Registro: undefined;
	CompletarRegistro: undefined;
	Login: undefined;
	Contactos: undefined;
	EditarPerfil: undefined;
	Notificaciones: undefined;
	DetalleGrupo: {
		grupoId: string;
		nombreGrupo: string;
		creadorId: string;
		materiaNombre: string;
		miembrosIds: string[];
	};
	MensajeDirecto: {
		contactoId: string;
		nombre: string;
		correo: string;
		userId?: string | null;
	};
	MensajeGrupo: {
		grupoId: string;
		nombreGrupo: string | null;
		userId?: string | null;
	};
};

const Stack = createStackNavigator<RootStackParamList>();

function getDeepestRouteName(state: NavigationState | undefined): string | null {
	if (!state) {
		return null;
	}

	let route = state.routes[state.index ?? 0] as any;
	while (route?.state?.routes) {
		const nestedState = route.state;
		route = nestedState.routes[nestedState.index ?? 0];
	}

	return route?.name ?? null;
}

function getCurrentRouteParams(state: NavigationState | undefined): any | null {
	if (!state) {
		return null;
	}

	let route = state.routes[state.index ?? 0] as any;
	while (route?.state?.routes) {
		const nestedState = route.state;
		route = nestedState.routes[nestedState.index ?? 0];
	}

	return route?.params ?? null;
}

export default function RootNavigator() {
	const [authChecked, setAuthChecked] = useState(false);
	const [initialRouteName, setInitialRouteName] = useState<'Home' | 'Principal'>('Home');
	const navigationRef = useRef<any>(null);
	const notificationSocketRef = useRef<Socket | null>(null);
	const activeRouteRef = useRef<string | null>(null);
	const activeRouteParamsRef = useRef<any | null>(null);
	const currentAuthUserIdRef = useRef<string | null>(null);
	const currentTokenRef = useRef<string | null>(null);
	const syncInProgressRef = useRef(false);

	useEffect(() => {
		let isMounted = true;

		const restoreSession = async () => {
			try {
				const isAuth = await authService.isAuthenticated();
				if (!isMounted) {
					return;
				}

				setInitialRouteName(isAuth ? 'Principal' : 'Home');
			} catch {
				if (!isMounted) {
					return;
				}
				setInitialRouteName('Home');
			} finally {
				if (isMounted) {
					setAuthChecked(true);
				}
			}
		};

		restoreSession();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		let isMounted = true;
		let syncTimer: ReturnType<typeof setInterval> | null = null;

		const teardownNotificationSocket = () => {
			notificationSocketRef.current?.disconnect();
			notificationSocketRef.current = null;
			currentAuthUserIdRef.current = null;
			currentTokenRef.current = null;
		};

		const connectNotificationSocket = (token: string, usuarioActualId: string) => {
			const socket = io(resolverApiBaseUrl(), {
				auth: { token },
				transports: ['websocket'],
				forceNew: true,
				reconnection: true,
				reconnectionAttempts: Infinity,
			});

			notificationSocketRef.current = socket;
			currentAuthUserIdRef.current = usuarioActualId;
			currentTokenRef.current = token;

			socket.on('mensaje:nuevo', async (msg: any) => {
				if (!isMounted) {
					return;
				}

				if (msg?.emisorId === currentAuthUserIdRef.current) {
					return;
				}

				const currentRoute = activeRouteRef.current;
				const currentParams = activeRouteParamsRef.current;

				const chatAbiertoConMismoContacto =
					currentRoute === 'MensajeDirecto' &&
					currentParams?.contactoId === msg?.emisorId;

				if (chatAbiertoConMismoContacto) {
					return;
				}

				const emisorNombre = [msg?.emisor?.nombre, msg?.emisor?.apellido]
					.filter(Boolean)
					.join(' ')
					.trim();

				await upsertUnreadDirectChatNotification({
					contactoId: String(msg?.emisorId ?? ''),
					nombre: emisorNombre,
					mensaje: String(msg?.contenido ?? ''),
				});

				await incrementUnreadNotificationsCount();
				await notifyIncomingMessage({
					title:
						emisorNombre.length > 0
							? `Nuevo mensaje de ${emisorNombre}`
							: 'Nuevo mensaje',
					body: String(msg?.contenido ?? 'Tienes un nuevo mensaje'),
					data: {
						type: 'direct-message',
						emisorId: String(msg?.emisorId ?? ''),
						receptorId: String(msg?.receptorId ?? ''),
					},
				});
			});

			socket.on('grupo:mensaje:nuevo', async (msg: any) => {
				if (!isMounted) {
					return;
				}

				if (msg?.emisorId === currentAuthUserIdRef.current) {
					return;
				}

				const currentRoute = activeRouteRef.current;
				const currentParams = activeRouteParamsRef.current;
				const chatGrupoAbierto =
					currentRoute === 'MensajeGrupo' && currentParams?.grupoId === msg?.grupoId;

				if (chatGrupoAbierto) {
					return;
				}

				const emisorNombre = [msg?.emisor?.nombre, msg?.emisor?.apellido]
					.filter(Boolean)
					.join(' ')
					.trim();
				const nombreGrupo =
					typeof msg?.nombreGrupo === 'string' && msg.nombreGrupo.trim().length > 0
						? msg.nombreGrupo.trim()
						: typeof msg?.grupo?.nombre === 'string' && msg.grupo.nombre.trim().length > 0
							? msg.grupo.nombre.trim()
							: null;

				await incrementUnreadNotificationsCount();
				await notifyIncomingMessage({
					title: nombreGrupo
						? `Nuevo mensaje en ${nombreGrupo}`
						: 'Nuevo mensaje de grupo',
					body:
						emisorNombre.length > 0
							? `${emisorNombre}: ${String(msg?.contenido ?? '')}`
							: String(msg?.contenido ?? 'Tienes un nuevo mensaje en grupo'),
					data: {
						type: 'group-message',
						grupoId: String(msg?.grupoId ?? ''),
						emisorId: String(msg?.emisorId ?? ''),
					},
				});
			});

			socket.on('contacto:solicitud:nueva', async (payload: any) => {
				if (!isMounted) {
					return;
				}

				if (payload?.solicitanteId === currentAuthUserIdRef.current) {
					return;
				}

				const nombreCompleto = [payload?.solicitanteNombre, payload?.solicitanteApellido]
					.filter(Boolean)
					.join(' ')
					.trim();

				await incrementUnreadNotificationsCount();
				await notifyIncomingMessage({
					title: 'Nueva solicitud de contacto',
					body:
						nombreCompleto.length > 0
							? `${nombreCompleto} te envio una solicitud de contacto`
							: 'Tienes una nueva solicitud de contacto',
					data: {
						type: 'contact-request',
						solicitudId: String(payload?.solicitudId ?? ''),
						solicitanteId: String(payload?.solicitanteId ?? ''),
					},
				});
			});
		};

		const syncGlobalNotificationsSocket = async () => {
			if (syncInProgressRef.current || !isMounted) {
				return;
			}

			syncInProgressRef.current = true;

			try {
				const token = await AsyncStorage.getItem('userToken');
				const usuarioActualId = await authService.obtenerIdUsuarioActual();

				if (!token || !usuarioActualId || !isMounted) {
					teardownNotificationSocket();
					return;
				}

				const socket = notificationSocketRef.current;
				const tokenCambio = currentTokenRef.current !== token;

				if (!socket || tokenCambio) {
					teardownNotificationSocket();
					connectNotificationSocket(token, usuarioActualId);
				} else {
					currentAuthUserIdRef.current = usuarioActualId;
					currentTokenRef.current = token;
					if (!socket.connected) {
						socket.connect();
					}
				}
			} catch (error) {
				console.error('[Notifications] Global listener setup failed:', error);
			} finally {
				syncInProgressRef.current = false;
			}
		};

		syncGlobalNotificationsSocket();
		syncTimer = setInterval(() => {
			syncGlobalNotificationsSocket();
		}, 3000);

		return () => {
			isMounted = false;
			if (syncTimer) {
				clearInterval(syncTimer);
			}
			teardownNotificationSocket();
		};
	}, []);

	if (!authChecked) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: theme.colors.white,
				}}
			>
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</View>
		);
	}

	return (
		<NavigationContainer
			ref={navigationRef}
			onReady={() => {
				const state = navigationRef.current?.getRootState?.();
				activeRouteRef.current = getDeepestRouteName(state as NavigationState);
				activeRouteParamsRef.current = getCurrentRouteParams(state as NavigationState);
			}}
			onStateChange={(state) => {
				activeRouteRef.current = getDeepestRouteName(state as NavigationState);
				activeRouteParamsRef.current = getCurrentRouteParams(state as NavigationState);
			}}
		>
			<Stack.Navigator
				initialRouteName={initialRouteName}
				screenOptions={{
					headerShown: false,
					cardStyle: {
						backgroundColor: theme.colors.white,
					},
				}}
			>
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen name="Grupos" component={GruposScreen} />
				<Stack.Screen name="Eventos" component={EventosScreen} />
				<Stack.Screen name="Registro" component={RegistroScreen} />
				<Stack.Screen name="CompletarRegistro" component={CompletarRegistroScreen} />
				<Stack.Screen name="Principal" component={PrincipalScreen} />
				<Stack.Screen name="Login" component={LoginScreen} />
				<Stack.Screen name="Contactos" component={ContactScreen} />
				<Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
				<Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
				<Stack.Screen name="MensajeDirecto" component={MensajeDirectoScreen} />
				<Stack.Screen name="DetalleGrupo" component={DetalleGrupoScreen} />
				<Stack.Screen name="MensajeGrupo" component={MensajeGrupoScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
