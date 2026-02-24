import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

const REQUEST_TIMEOUT_MS = 10000;

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

const API_BASE_URL = resolverApiBaseUrl();

type Usuario = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  carrera?: string | null;
};

export default function App() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const cargarUsuarios = async () => {
      if (!API_BASE_URL.trim()) {
        if (isMounted) {
          setError('No se pudo resolver la URL del backend. Define EXPO_PUBLIC_API_URL (ej: http://192.168.x.x:3000).');
          setLoading(false);
        }
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json();
        if (isMounted) {
          setUsuarios(payload.data ?? []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof Error && err.name === 'AbortError') {
            setError(`Tiempo de espera agotado conectando a ${API_BASE_URL || '(URL no definida)'}`);
          } else {
            setError(err instanceof Error ? err.message : 'Error desconocido');
          }
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    cargarUsuarios();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UniConnect</Text>
      <Text style={styles.subtitle}>Usuarios</Text>

      {loading && <ActivityIndicator />}
      {error && <Text style={styles.error}>Error: {error}</Text>}

      {!loading && !error && (
        <ScrollView contentContainerStyle={styles.list}>
          {usuarios.map((usuario) => (
            <View key={usuario.id} style={styles.card}>
              <Text style={styles.name}>
                {usuario.nombre} {usuario.apellido}
              </Text>
              <Text style={styles.email}>{usuario.correo}</Text>
              {usuario.carrera && (
                <Text style={styles.career}>{usuario.carrera}</Text>
              )}
            </View>
          ))}
          {usuarios.length === 0 && (
            <Text style={styles.empty}>No hay usuarios registrados.</Text>
          )}
        </ScrollView>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 64,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
    alignItems: 'stretch',
  },
  card: {
    width: 320,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  career: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  empty: {
    marginTop: 16,
    color: '#666',
  },
  error: {
    color: '#b00020',
    marginBottom: 12,
  },
});
