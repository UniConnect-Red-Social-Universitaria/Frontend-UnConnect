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
import * as DocumentPicker from 'expo-document-picker';
import theme from '../styles/theme';

type RootStackParamList = {
	Eventos: undefined;
	Grupos: undefined;
	Login: undefined;
};

type GruposScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Grupos'>;

const REQUEST_TIMEOUT_MS = 10000;
const AUTH_TOKEN_STORAGE_KEY = 'userToken';
const LIMITE_PDF_BYTES = 10 * 1024 * 1024;

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

type GrupoDisponible = {
	id: string;
	nombre: string;
	materia: {
		id: string;
		nombre: string;
	};
	creadorId: string;
	cantidadMiembros: number;
	maxMiembros: number;
	cuposDisponibles: number;
	estaLleno: boolean;
	yaPertenece: boolean;
	miembros: Array<{
		id: string;
		nombre: string;
		apellido: string;
	}>;
	createdAt: string;
};

type ArchivoGrupo = {
	id: string;
	nombre: string;
	mimeType: string;
	tamanoBytes: number;
	grupoId: string;
	createdAt: string;
	descargarUrl: string;
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
	const [gruposDisponibles, setGruposDisponibles] = useState<GrupoDisponible[]>([]);
	const [recursosPorGrupo, setRecursosPorGrupo] = useState<Record<string, ArchivoGrupo[]>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [processingGrupoId, setProcessingGrupoId] = useState<string | null>(null);
	const [subiendoGrupoId, setSubiendoGrupoId] = useState<string | null>(null);

	const apiBaseUrl = resolverApiBaseUrl();

	const esPdfValido = (archivo: DocumentPicker.DocumentPickerAsset) => {
		const nombre = archivo.name?.toLowerCase() ?? '';
		const mimeType = archivo.mimeType?.toLowerCase() ?? '';
		const extensionPdf = nombre.endsWith('.pdf');
		const mimePdf = mimeType === 'application/pdf' || mimeType === '';

		return extensionPdf && mimePdf;
	};

	const formatearTamano = (bytes: number) => {
		if (bytes >= 1024 * 1024) {
			return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		}

		return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	};

	const cargarRecursos = useCallback(
		async (jwt: string, gruposUsuario: Grupo[]) => {
			if (gruposUsuario.length === 0) {
				setRecursosPorGrupo({});
				return;
			}

			const resultados = await Promise.all(
				gruposUsuario.map(async (grupo) => {
					try {
						const response = await fetch(`${apiBaseUrl}/api/grupos/${grupo.id}/archivos`, {
							headers: {
								Authorization: `Bearer ${jwt}`,
							},
						});

						if (!response.ok) {
							return [grupo.id, []] as const;
						}

						const payload = await response.json();
						const archivos = Array.isArray(payload.data) ? payload.data : [];
						return [grupo.id, archivos as ArchivoGrupo[]] as const;
					} catch {
						return [grupo.id, []] as const;
					}
				})
			);

			setRecursosPorGrupo(Object.fromEntries(resultados));
		},
		[apiBaseUrl]
	);

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
				const [misGruposResponse, disponiblesResponse] = await Promise.all([
					fetch(`${apiBaseUrl}/api/grupos`, {
						signal: controller.signal,
						headers: {
							Authorization: `Bearer ${jwt.trim()}`,
						},
					}),
					fetch(`${apiBaseUrl}/api/grupos/disponibles`, {
						signal: controller.signal,
						headers: {
							Authorization: `Bearer ${jwt.trim()}`,
						},
					}),
				]);

				const [misGruposPayload, disponiblesPayload] = await Promise.all([
					misGruposResponse
						.json()
						.catch(() => ({ success: false, message: 'Respuesta inválida en /api/grupos' })),
					disponiblesResponse
						.json()
						.catch(() => ({ success: false, message: 'Respuesta inválida en /api/grupos/disponibles' })),
				]);

				if (misGruposResponse.status === 401 || disponiblesResponse.status === 401) {
					await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
					setError('Sesion expirada o token invalido. Inicia sesion nuevamente.');
					navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
					setLoading(false);
					return;
				}

				if (misGruposResponse.ok && misGruposPayload.success) {
					const gruposUsuario = (misGruposPayload.data ?? []) as Grupo[];
					setGrupos(gruposUsuario);
					await cargarRecursos(jwt.trim(), gruposUsuario);
				} else {
					setGrupos([]);
					setRecursosPorGrupo({});
				}

				if (disponiblesResponse.ok && disponiblesPayload.success) {
					setGruposDisponibles(disponiblesPayload.data ?? []);
				} else {
					setGruposDisponibles([]);
				}

				if (
					(!misGruposResponse.ok || !misGruposPayload.success) &&
					(!disponiblesResponse.ok || !disponiblesPayload.success)
				) {
					const mensajeBackend =
						misGruposPayload.message ??
						disponiblesPayload.message ??
						'No se pudieron cargar los grupos.';
					setError(String(mensajeBackend));
				} else {
					setError(null);
				}
			} catch (err) {
				if (err instanceof Error && err.name === 'AbortError') {
					setError(`Tiempo de espera agotado conectando a ${apiBaseUrl}`);
				} else {
					setError(err instanceof Error ? err.message : 'Error desconocido');
				}
				setGruposDisponibles([]);
			} finally {
				clearTimeout(timeoutId);
				setLoading(false);
			}
		},
		[apiBaseUrl, cargarRecursos, navigation]
	);

	const unirseAGrupo = useCallback(
		async (grupoId: string) => {
			setProcessingGrupoId(grupoId);

			try {
				const tokenGuardado = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

				if (!tokenGuardado?.trim()) {
					setError('No hay sesion activa. Inicia sesion para unirte a grupos.');
					return;
				}

				const response = await fetch(`${apiBaseUrl}/api/grupos/${grupoId}/unirse`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${tokenGuardado.trim()}`,
						'Content-Type': 'application/json',
					},
				});

				const payload = await response.json();

				if (!response.ok || !payload.success) {
					setError(payload.message ?? 'No se pudo completar la union al grupo.');
					return;
				}

				setError(null);
				await cargarGrupos(tokenGuardado.trim());
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Error al unirse al grupo');
			} finally {
				setProcessingGrupoId(null);
			}
		},
		[apiBaseUrl, cargarGrupos]
	);

	const seleccionarYSubirPdf = useCallback(
		async (grupoId: string) => {
			setSubiendoGrupoId(grupoId);

			try {
				const tokenGuardado = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

				if (!tokenGuardado?.trim()) {
					setError('No hay sesion activa. Inicia sesion para subir archivos.');
					return;
				}

				const resultado = await DocumentPicker.getDocumentAsync({
					type: 'application/pdf',
					copyToCacheDirectory: true,
					multiple: false,
				});

				if (resultado.canceled) {
					return;
				}

				const archivo = resultado.assets?.[0];

				if (!archivo) {
					setError('No se pudo leer el archivo seleccionado.');
					return;
				}

				if (!esPdfValido(archivo)) {
					setError('Solo se permiten archivos PDF.');
					return;
				}

				if (typeof archivo.size === 'number' && archivo.size > LIMITE_PDF_BYTES) {
					setError('El archivo excede el limite de 10MB.');
					return;
				}

				const formData = new FormData();
				formData.append('archivo', {
					uri: archivo.uri,
					name: archivo.name || `documento-${Date.now()}.pdf`,
					type: 'application/pdf',
				} as unknown as Blob);

				const response = await fetch(`${apiBaseUrl}/api/grupos/${grupoId}/archivos`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${tokenGuardado.trim()}`,
					},
					body: formData,
				});

				const payload = await response.json();

				if (!response.ok || !payload.success) {
					setError(payload.message ?? 'No se pudo subir el archivo PDF.');
					return;
				}

				setError(null);
				await cargarGrupos(tokenGuardado.trim());
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Error al subir archivo PDF');
			} finally {
				setSubiendoGrupoId(null);
			}
		},
		[apiBaseUrl, cargarGrupos]
	);

	useEffect(() => {
		let isMounted = true;

		const inicializar = async () => {
			try {
				const tokenGuardado = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
				const tokenNormalizado = tokenGuardado?.trim() ?? '';

				if (
					isMounted &&
					tokenNormalizado &&
					tokenNormalizado !== 'null' &&
					tokenNormalizado !== 'undefined'
				) {
					await cargarGrupos(tokenNormalizado);
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
						<View style={styles.sectionCard}>
							<Text style={styles.sectionTitle}>Grupos disponibles</Text>
							{gruposDisponibles.map((grupo) => {
								const botonDeshabilitado =
									grupo.yaPertenece || grupo.estaLleno || processingGrupoId === grupo.id;

								let textoBoton = 'Unirme';

								if (grupo.yaPertenece) {
									textoBoton = 'Ya eres miembro';
								} else if (grupo.estaLleno) {
									textoBoton = 'Grupo lleno';
								} else if (processingGrupoId === grupo.id) {
									textoBoton = 'Uniendome...';
								}

								return (
									<View key={grupo.id} style={styles.card}>
										<Text style={styles.groupTitle}>{grupo.nombre}</Text>
										<Text style={styles.groupMateria}>Materia: {grupo.materia.nombre}</Text>
										<Text style={styles.groupMembers}>
											{grupo.cantidadMiembros}/{grupo.maxMiembros} integrantes
										</Text>
										<Pressable
											onPress={() => unirseAGrupo(grupo.id)}
											disabled={botonDeshabilitado}
											style={[
												styles.joinButton,
												botonDeshabilitado ? styles.joinButtonDisabled : null,
											]}
										>
											<Text style={styles.joinButtonText}>{textoBoton}</Text>
										</Pressable>
									</View>
								);
							})}
							{gruposDisponibles.length === 0 && (
								<Text style={styles.empty}>No hay grupos disponibles por ahora.</Text>
							)}
						</View>

						<View style={styles.sectionCard}>
							<Text style={styles.sectionTitle}>Mis grupos</Text>
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

								<View style={styles.recursosContainer}>
									<View style={styles.recursosHeaderRow}>
										<Text style={styles.recursosTitle}>Recursos del grupo</Text>
										<Pressable
											onPress={() => seleccionarYSubirPdf(grupo.id)}
											disabled={subiendoGrupoId === grupo.id}
											style={[
												styles.uploadButton,
												subiendoGrupoId === grupo.id ? styles.uploadButtonDisabled : null,
											]}
										>
											<Text style={styles.uploadButtonText}>
												{subiendoGrupoId === grupo.id ? 'Subiendo...' : 'Subir PDF'}
											</Text>
										</Pressable>
									</View>

									{(recursosPorGrupo[grupo.id] ?? []).length === 0 ? (
										<Text style={styles.emptyResourceText}>
											No hay archivos cargados en este grupo.
										</Text>
									) : (
										(recursosPorGrupo[grupo.id] ?? []).map((archivo) => (
											<View key={archivo.id} style={styles.resourceItem}>
												<View style={styles.resourceInfo}>
													<Text style={styles.resourceName}>{archivo.nombre}</Text>
													<Text style={styles.resourceMeta}>
														{formatearTamano(archivo.tamanoBytes)}
													</Text>
												</View>
												<Text style={styles.resourceTag}>PDF</Text>
											</View>
										))
									)}
								</View>
							</View>
						))}
						{grupos.length === 0 && (
							<Text style={styles.empty}>No perteneces a ningún grupo todavía.</Text>
						)}
						</View>
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
	sectionCard: {
		width: '100%',
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#E0E0E0',
		borderRadius: 12,
		padding: 12,
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: theme.colors.primary,
		marginBottom: 8,
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
	recursosContainer: {
		marginTop: 12,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: '#D9E1EA',
	},
	recursosHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	recursosTitle: {
		fontSize: 14,
		fontWeight: '700',
		color: theme.colors.primary,
	},
	uploadButton: {
		backgroundColor: '#0A7F5A',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
	},
	uploadButtonDisabled: {
		opacity: 0.5,
	},
	uploadButtonText: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 12,
	},
	emptyResourceText: {
		fontSize: 13,
		color: theme.colors.primaryMid,
	},
	resourceItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#E7EDF3',
	},
	resourceInfo: {
		flex: 1,
		paddingRight: 10,
	},
	resourceName: {
		fontSize: 13,
		fontWeight: '600',
		color: theme.colors.primary,
	},
	resourceMeta: {
		fontSize: 12,
		color: theme.colors.primaryMid,
		marginTop: 2,
	},
	resourceTag: {
		fontSize: 11,
		fontWeight: '700',
		color: '#0A7F5A',
		backgroundColor: '#E8F7F1',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 999,
	},
	joinButton: {
		marginTop: 10,
		backgroundColor: theme.colors.primary,
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 14,
		alignItems: 'center',
	},
	joinButtonDisabled: {
		opacity: 0.5,
	},
	joinButtonText: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 14,
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
