import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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
import { resolverApiBaseUrl } from '../utils/apiConfig';
import { authService } from '../services';
import { notifyIncomingMessage } from '../services/notificaciones.service';

export type RootStackParamList = {
	Home: undefined;
	Principal: undefined;
	Grupos: undefined;
	Eventos: undefined;
	Registro: undefined;
	CompletarRegistro: undefined;
	Login: undefined;
	Contactos: undefined;
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
	const navigationRef = useRef<any>(null);
	const notificationSocketRef = useRef<Socket | null>(null);
	const activeRouteRef = useRef<string | null>(null);
	const activeRouteParamsRef = useRef<any | null>(null);

	useEffect(() => {
		let isMounted = true;

		const setupGlobalNotifications = async () => {
			try {
				const token = await AsyncStorage.getItem('userToken');
				if (!token || !isMounted) {
					return;
				}

				const usuarioActualId = await authService.obtenerIdUsuarioActual();
				if (!usuarioActualId || !isMounted) {
					return;
				}

				const socket = io(resolverApiBaseUrl(), {
					auth: { token },
					transports: ['websocket'],
					forceNew: true,
					reconnection: true,
					reconnectionAttempts: Infinity,
				});

				notificationSocketRef.current = socket;

				socket.on('mensaje:nuevo', async (msg: any) => {
					if (!isMounted) {
						return;
					}

					// Ignore echo/self messages to avoid noisy notifications.
					if (msg?.emisorId === usuarioActualId) {
						return;
					}

					const currentRoute = activeRouteRef.current;
					const currentParams = activeRouteParamsRef.current;

					const chatAbiertoConMismoContacto =
						currentRoute === 'MensajeDirecto' &&
						(currentParams?.contactoId === msg?.emisorId ||
							currentParams?.contactoId === msg?.receptorId);

					if (chatAbiertoConMismoContacto) {
						return;
					}

					await notifyIncomingMessage({
						title: 'Nuevo mensaje',
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

					if (msg?.emisorId === usuarioActualId) {
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

					await notifyIncomingMessage({
						title: msg?.nombreGrupo
							? `Nuevo mensaje en ${String(msg.nombreGrupo)}`
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
			} catch (error) {
				console.error('[Notifications] Global listener setup failed:', error);
			}
		};

		setupGlobalNotifications();

		return () => {
			isMounted = false;
			notificationSocketRef.current?.disconnect();
			notificationSocketRef.current = null;
		};
	}, []);

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
				initialRouteName="Home"
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
				<Stack.Screen name="MensajeDirecto" component={MensajeDirectoScreen} />
				<Stack.Screen name="DetalleGrupo" component={DetalleGrupoScreen} />
				<Stack.Screen name="MensajeGrupo" component={MensajeGrupoScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
