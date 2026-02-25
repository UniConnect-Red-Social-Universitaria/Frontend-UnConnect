import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import theme from '../styles/theme';

type RootStackParamList = {
  Eventos: undefined;
  Grupos: undefined;
};

type EventosScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Eventos'>;

const REQUEST_TIMEOUT_MS = 10000;
const AUTH_TOKEN_STORAGE_KEY = 'uniconnect_auth_token';

type Evento = {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEvento: string;
  creador: {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
  };
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
      const hostNormalizado = hostDetectado.includes(':') ? `[${hostDetectado}]` : hostDetectado;
      return `http://${hostNormalizado}:3000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

function formatearFechaEvento(fechaIso: string): string {
  const fecha = new Date(fechaIso);

  if (Number.isNaN(fecha.getTime())) {
    return 'Fecha inválida';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(fecha);
}

type EventosScreenProps = {
  navigation: EventosScreenNavigationProp;
};

export function EventosScreen({ navigation }: EventosScreenProps) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajePublicacion, setMensajePublicacion] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEventoInput, setFechaEventoInput] = useState('');
  const [token, setToken] = useState(process.env.EXPO_PUBLIC_AUTH_TOKEN?.trim() ?? '');

  const apiBaseUrl = resolverApiBaseUrl();

  const cargarEventos = useCallback(async () => {
    if (!apiBaseUrl.trim()) {
      setError('No se pudo resolver la URL del backend. Define EXPO_PUBLIC_API_URL (ej: http://192.168.x.x:3000).');
      setLoadingEventos(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${apiBaseUrl}/api/eventos`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      setEventos(payload.data ?? []);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError(`Tiempo de espera agotado conectando a ${apiBaseUrl || '(URL no definida)'}`);
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoadingEventos(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    let isMounted = true;

    const cargarTokenGuardado = async () => {
      try {
        const tokenGuardado = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        if (isMounted && tokenGuardado?.trim()) {
          setToken((valorActual: string) => (valorActual.trim() ? valorActual : tokenGuardado.trim()));
        }
      } catch {
        if (isMounted) {
          setMensajePublicacion('No se pudo leer el token guardado localmente.');
        }
      }
    };

    cargarTokenGuardado();
    setLoadingEventos(true);
    cargarEventos();

    return () => {
      isMounted = false;
    };
  }, [cargarEventos]);

  const publicarEvento = async () => {
    if (!titulo.trim()) {
      setMensajePublicacion('Debes escribir un título.');
      return;
    }

    if (!descripcion.trim()) {
      setMensajePublicacion('Debes escribir una descripción.');
      return;
    }

    if (!fechaEventoInput.trim()) {
      setMensajePublicacion('Debes escribir la fecha del evento en formato YYYY-MM-DDTHH:mm.');
      return;
    }

    if (!token.trim()) {
      setMensajePublicacion('Debes pegar tu JWT para publicar eventos.');
      return;
    }

    const fecha = new Date(fechaEventoInput.trim());
    if (Number.isNaN(fecha.getTime())) {
      setMensajePublicacion('La fecha tiene formato inválido. Usa YYYY-MM-DDTHH:mm.');
      return;
    }

    setPublicando(true);
    setMensajePublicacion(null);

    try {
      await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.trim());

      const response = await fetch(`${apiBaseUrl}/api/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fechaEvento: fecha.toISOString(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const mensaje = typeof payload?.message === 'string' ? payload.message : `HTTP ${response.status}`;
        throw new Error(mensaje);
      }

      setTitulo('');
      setDescripcion('');
      setFechaEventoInput('');
      setMensajePublicacion('Evento publicado correctamente.');
      await cargarEventos();
    } catch (err) {
      setMensajePublicacion(err instanceof Error ? err.message : 'No se pudo publicar el evento.');
    } finally {
      setPublicando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/ucaldas-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>UniConnect</Text>
          <Text style={styles.subtitle}>Eventos</Text>
          <Text style={styles.caption}>Comunidad Universidad de Caldas</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Publicar evento</Text>

        <TextInput
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Título"
          placeholderTextColor={theme.colors.primaryMid}
          style={styles.input}
        />

        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripción"
          placeholderTextColor={theme.colors.primaryMid}
          style={[styles.input, styles.inputMultiline]}
          multiline
        />

        <TextInput
          value={fechaEventoInput}
          onChangeText={setFechaEventoInput}
          placeholder="Fecha (YYYY-MM-DDTHH:mm)"
          placeholderTextColor={theme.colors.primaryMid}
          style={styles.input}
          autoCapitalize="none"
        />

        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder="JWT (Bearer token)"
          placeholderTextColor={theme.colors.primaryMid}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {mensajePublicacion && <Text style={styles.formMessage}>{mensajePublicacion}</Text>}

        <Pressable
          onPress={publicarEvento}
          disabled={publicando}
          style={({ pressed }) => [
            styles.button,
            pressed && !publicando ? styles.buttonPressed : null,
            publicando ? styles.buttonDisabled : null,
          ]}
        >
          <Text style={styles.buttonText}>{publicando ? 'Publicando...' : 'Publicar evento'}</Text>
        </Pressable>
      </View>

      {loadingEventos && <ActivityIndicator color={theme.colors.primary} size="large" />}
      {error && <Text style={styles.error}>Error: {error}</Text>}

      {!loadingEventos && !error && (
        <ScrollView contentContainerStyle={styles.list}>
          {eventos.map((evento) => (
            <View key={evento.id} style={styles.card}>
              <Text style={styles.eventTitle}>{evento.titulo}</Text>
              <Text style={styles.eventDate}>{formatearFechaEvento(evento.fechaEvento)}</Text>
              <Text style={styles.eventDescription}>{evento.descripcion}</Text>
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

      <Pressable
        style={styles.navButton}
        onPress={() => navigation.navigate('Grupos')}
      >
        <Text style={styles.navButtonText}>Ver Mis Grupos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 56,
    paddingHorizontal: 20,
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
  formCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.primary,
    backgroundColor: theme.colors.white,
    marginBottom: 10,
  },
  inputMultiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  formMessage: {
    fontSize: 13,
    color: theme.colors.primaryMid,
    marginBottom: 8,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
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
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  eventDate: {
    fontSize: 14,
    color: theme.colors.primaryMid,
    marginTop: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 8,
    lineHeight: 20,
  },
  eventAuthor: {
    fontSize: 13,
    color: theme.colors.primaryMid,
    marginTop: 10,
    fontWeight: '500',
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
  },
  navButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
