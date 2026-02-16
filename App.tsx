import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

const API_BASE_URL = 'http://192.168.1.7:3000';

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
      try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios`);
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
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
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
