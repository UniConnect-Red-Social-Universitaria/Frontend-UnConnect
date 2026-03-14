import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { ActivityIndicator, View } from 'react-native';
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
	DetalleGrupo: { grupoId: string; nombreGrupo: string };
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

export default function RootNavigator() {
	const socketRef = useRef<any>(null);
	const currentUserIdRef = useRef<string | null>(null);
	const [authReady, setAuthReady] = useState(false);
	const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Home');

	useEffect(() => {
		let mounted = true;

		const restoreSession = async () => {
			try {
				const isAuthenticated = await authService.isAuthenticated();
				if (!mounted) return;
				setInitialRoute(isAuthenticated ? 'Principal' : 'Home');
			} finally {
				if (mounted) {
					setAuthReady(true);
				}
			}
		};

		restoreSession();

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		let isUnmounted = false;

		const connectNotificationsSocket = async () => {
			try {
				const token = await AsyncStorage.getItem('userToken');

				if (isUnmounted) {
					return;
				}

				if (!token) {
					socketRef.current?.disconnect();
					socketRef.current = null;
					currentUserIdRef.current = null;
					return;
				}

				if (!currentUserIdRef.current) {
					currentUserIdRef.current = await authService.obtenerIdUsuarioActual();
				}

				if (!socketRef.current) {
					const socket = io(resolverApiBaseUrl(), {
						auth: { token },
						forceNew: true,
						multiplex: false,
					});

					socket.on('connect_error', (error: Error) => {
						console.log('[Notifications Socket] connect_error:', error.message);
					});

					socket.on('mensaje:nuevo', async (msg: any) => {
						if (!msg) {
							return;
						}

						const isOwnMessage =
							String(msg.emisorId ?? '') === String(currentUserIdRef.current ?? '');

						if (isOwnMessage) {
							return;
						}

						await notifyIncomingMessage({
							title: `Mensaje de ${msg.emisor?.nombre ?? 'un contacto'}`,
							body:
								typeof msg.contenido === 'string'
									? msg.contenido
									: 'Tienes un mensaje nuevo',
							data: {
								type: 'direct_message',
								contactoId: String(msg.emisorId ?? ''),
							},
						});
					});

					socket.on('grupo:mensaje:nuevo', async (msg: any) => {
						if (!msg) {
							return;
						}

						const isOwnMessage =
							String(msg.emisorId ?? '') === String(currentUserIdRef.current ?? '');

						if (isOwnMessage) {
							return;
						}

						await notifyIncomingMessage({
							title: `${msg.emisor?.nombre ?? 'Alguien'} escribio en un grupo`,
							body:
								typeof msg.contenido === 'string'
									? msg.contenido
									: 'Tienes un mensaje nuevo de grupo',
							data: {
								type: 'group_message',
								grupoId: String(msg.grupoId ?? ''),
							},
						});
					});

					socketRef.current = socket;
					return;
				}

				socketRef.current.auth = { token };
				if (socketRef.current.disconnected) {
					socketRef.current.connect();
				}
			} catch (error) {
				console.error('[Notifications Socket] setup error:', error);
			}
		};

		connectNotificationsSocket();
		const intervalId = setInterval(connectNotificationsSocket, 2000);

		return () => {
			isUnmounted = true;
			clearInterval(intervalId);
			socketRef.current?.disconnect();
			socketRef.current = null;
		};
	}, []);

	if (!authReady) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color={theme.colors.primaryDark} />
			</View>
		);
	}

	return (
		<NavigationContainer>
			<Stack.Navigator
				initialRouteName={initialRoute}
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
