import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import theme from '../styles/theme';

type RootStackParamList = {
	Eventos: undefined;
	Grupos: undefined;
};

type GruposScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Grupos'>;

const REQUEST_TIMEOUT_MS = 10000;
const AUTH_TOKEN_STORAGE_KEY = 'userToken';

type Grupo = {
	id: string;
	nombre: string;
	materia: {
		id: string;
		nombre: string;
	};
	creadorId: string;
	cantidadMiembros: number;
	miembros: Array<{
		id: string;
		nombre: string;
		apellido: string;
	}>;
	createdAt: string;
};

function extraerHostDesdeHostUri(hostUri: string): string | null {
	const valor = hostUri.trim();

	if (!valor) {
		return null;
	}

	if (/^[a-z]+:\/\//i.test(valor)) {
		try {
			const url = new URL(valor);
			return url.hostname || null;
		} catch {
			return null;
		}
	}

	if (valor.startsWith('[')) {
		const fin = valor.indexOf(']');
		return fin > 1 ? valor.slice(1, fin) : null;
	}

	const partes = valor.split(':');
	if (partes.length >= 2) {
		return partes[0] || null;
	}

	return valor;
}

function esHostLanValido(host: string): boolean {
	const hostNormalizado = host.replace(/^\[|\]$/g, '').toLowerCase();

	if (hostNormalizado === 'localhost' || hostNormalizado.endsWith('.local')) {
		return true;
	}

	const matchIpv4 = hostNormalizado.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (!matchIpv4) {
		return false;
	}

	const octetos = matchIpv4.slice(1).map(Number);
	if (octetos.some((octeto) => Number.isNaN(octeto) || octeto < 0 || octeto > 255)) {
		return false;
	}

	const [a, b] = octetos;
	if (a === 10) {
		return true;
	}
	if (a === 172 && b >= 16 && b <= 31) {
		return true;
	}
	if (a === 192 && b === 168) {
		return true;
	}

	return false;
}

function obtenerHostExpo(): string | null {
	const configExpo = Constants.expoConfig as { hostUri?: string } | null;

	if (configExpo?.hostUri) {
		return configExpo.hostUri;
	}

	const constantsConManifest = Constants as unknown as {
		manifest2?: {
			extra?: {
				expoClient?: {
					hostUri?: string;
				};
			};
		};
	};

	return constantsConManifest.manifest2?.extra?.expoClient?.hostUri ?? null;
}

function resolverApiBaseUrl(): string {
	const apiUrlConfiguradaRaw = process.env.EXPO_PUBLIC_API_URL;
	const apiUrlConfigurada = apiUrlConfiguradaRaw?.trim().replace(/\/+$/, '') ?? '';

	if (apiUrlConfigurada) {
		return apiUrlConfigurada;
	}

	const hostUriExpo = obtenerHostExpo();

	if (hostUriExpo) {
		const hostDetectado = extraerHostDesdeHostUri(hostUriExpo);
		if (hostDetectado && esHostLanValido(hostDetectado)) {
			const hostNormalizado = hostDetectado.includes(':')
				? `[${hostDetectado}]`
				: hostDetectado;
			return `http://${hostNormalizado}:3000`;
		}
	}

	if (Platform.OS === 'android') {
		return 'http://10.0.2.2:3000';
	}

	return 'http://localhost:3000';
}

type GruposScreenProps = {
	navigation: GruposScreenNavigationProp;
};

export function GruposScreen({ navigation }: GruposScreenProps) {
	const [grupos, setGrupos] = useState<Grupo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [token, setToken] = useState('');

	const apiBaseUrl = resolverApiBaseUrl();

	const cargarGrupos = useCallback(
		async (jwt: string) => {
			if (!apiBaseUrl.trim()) {
				setError('No se pudo resolver la URL del backend.');
				setLoading(false);
				return;
			}

			if (!jwt.trim()) {
				setError('Debes iniciar sesión para ver tus grupos.');
				setLoading(false);
				return;
			}

			const controller = new AbortController();
			const timeoutId = setTimeout(() => {
				controller.abort();
			}, REQUEST_TIMEOUT_MS);

			try {
				const response = await fetch(`${apiBaseUrl}/api/grupos`, {
					signal: controller.signal,
					headers: {
						Authorization: `Bearer ${jwt.trim()}`,
					},
				});

				if (!response.ok) {
					if (response.status === 401) {
						throw new Error('Sesión expirada. Inicia sesión nuevamente.');
					}
					throw new Error(`HTTP ${response.status}`);
				}

				const payload = await response.json();
				setGrupos(payload.data ?? []);
				setError(null);
			} catch (err) {
				if (err instanceof Error && err.name === 'AbortError') {
					setError(`Tiempo de espera agotado conectando a ${apiBaseUrl}`);
				} else {
					setError(err instanceof Error ? err.message : 'Error desconocido');
				}
			} finally {
				clearTimeout(timeoutId);
				setLoading(false);
			}
		},
		[apiBaseUrl]
	);

	useEffect(() => {
		let isMounted = true;

		const inicializar = async () => {
			try {
				const tokenGuardado = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
				if (isMounted && tokenGuardado?.trim()) {
					setToken(tokenGuardado.trim());
					await cargarGrupos(tokenGuardado.trim());
				} else {
					if (isMounted) {
						setError('No hay sesión activa. Inicia sesión para ver tus grupos.');
						setLoading(false);
					}
				}
			} catch {
				if (isMounted) {
					setError('No se pudo cargar la sesión.');
					setLoading(false);
				}
			}
		};

		inicializar();

		return () => {
			isMounted = false;
		};
	}, [cargarGrupos]);

	return (
		<View style={styles.container}>
			<View style={styles.contentWrapper}>
				<View style={styles.header}>
					<Image
						source={require('../../assets/images/logo-caldas.png')}
						style={styles.logoImage}
						resizeMode="contain"
					/>
					<View style={styles.headerText}>
						<Text style={styles.title}>UniConnect</Text>
						<Text style={styles.subtitle}>Mis Grupos</Text>
						<Text style={styles.caption}>Comunidad Universidad de Caldas</Text>
					</View>
				</View>

				{loading && <ActivityIndicator color={theme.colors.primary} size="large" />}
				{error && <Text style={styles.error}>{error}</Text>}

				{!loading && !error && (
					<ScrollView contentContainerStyle={styles.list} style={styles.scrollView}>
						{grupos.map((grupo) => (
							<View key={grupo.id} style={styles.card}>
								<Text style={styles.groupTitle}>{grupo.nombre}</Text>
								<Text style={styles.groupMateria}>Materia: {grupo.materia.nombre}</Text>
								<Text style={styles.groupMembers}>
									{grupo.cantidadMiembros}{' '}
									{grupo.cantidadMiembros === 1 ? 'miembro' : 'miembros'}
								</Text>
								<View style={styles.membersList}>
									{grupo.miembros.slice(0, 3).map((miembro) => (
										<Text key={miembro.id} style={styles.memberName}>
											• {miembro.nombre} {miembro.apellido}
										</Text>
									))}
									{grupo.cantidadMiembros > 3 && (
										<Text style={styles.memberName}>
											• y {grupo.cantidadMiembros - 3} más...
										</Text>
									)}
								</View>
							</View>
						))}
						{grupos.length === 0 && (
							<Text style={styles.empty}>No perteneces a ningún grupo todavía.</Text>
						)}
					</ScrollView>
				)}
			</View>

			<Pressable style={styles.navButton} onPress={() => navigation.navigate('Eventos')}>
				<Text style={styles.navButtonText}>Ver Eventos</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.white,
	},
	contentWrapper: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingTop: 56,
		paddingHorizontal: 20,
	},
	scrollView: {
		width: '100%',
	},
	header: {
		width: '100%',
		backgroundColor: theme.colors.white,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		borderRadius: 14,
		paddingVertical: 14,
		paddingHorizontal: 16,
		marginBottom: 18,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	logoImage: {
		width: 50,
		height: 50,
	},
	headerText: {
		flex: 1,
	},
	title: {
		fontSize: 30,
		fontWeight: '700',
		color: theme.colors.primary,
	},
	subtitle: {
		fontSize: 20,
		fontWeight: '600',
		marginTop: 2,
		color: theme.colors.primary,
	},
	caption: {
		fontSize: 13,
		marginTop: 4,
		color: theme.colors.primaryMid,
	},
	list: {
		gap: 12,
		paddingBottom: 24,
		alignItems: 'stretch',
		width: '100%',
	},
	card: {
		width: '100%',
		borderWidth: 1,
		borderColor: '#E0E0E0',
		borderRadius: 12,
		padding: 14,
		backgroundColor: '#F5F5F5',
	},
	groupTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: theme.colors.primary,
		marginBottom: 6,
	},
	groupMateria: {
		fontSize: 14,
		color: theme.colors.primaryMid,
		marginBottom: 8,
		fontWeight: '600',
	},
	groupMembers: {
		fontSize: 13,
		color: theme.colors.primaryMid,
		marginBottom: 8,
	},
	membersList: {
		marginTop: 4,
	},
	memberName: {
		fontSize: 13,
		color: theme.colors.primary,
		marginBottom: 2,
	},
	empty: {
		marginTop: 16,
		color: theme.colors.primaryMid,
		textAlign: 'center',
	},
	error: {
		color: '#b00020',
		marginBottom: 12,
		textAlign: 'center',
		paddingHorizontal: 20,
	},
	navButton: {
		width: '100%',
		backgroundColor: theme.colors.primary,
		borderRadius: 0,
		paddingVertical: 24,
		paddingHorizontal: 20,
		alignItems: 'center',
		marginTop: 0,
		paddingBottom: 46,
		paddingTop: 24,
		minHeight: 80,
	},
	navButtonText: {
		color: '#ffffff',
		fontSize: 20,
		fontWeight: '700',
	},
});
