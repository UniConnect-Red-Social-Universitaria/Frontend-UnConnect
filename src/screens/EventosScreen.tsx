import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import theme from "../styles/theme";
import { styles } from "../styles/EventosScreen.styles";
import { apiClient } from "../services";
import { CrearEventoModal } from "../components/CrearEventoModal";

// --- Tipos ---
type RootStackParamList = {
  Eventos: undefined;
  Grupos: undefined;
};

type EventosScreenNavigationProp = StackNavigationProp<RootStackParamList, "Eventos">;

type Evento = {
  id: string;
  titulo: string;
  descripcion: string;
  lugar?: string | null;
  fechaEvento: string;
  creador: {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
  };
};

type EventosScreenProps = {
  navigation: EventosScreenNavigationProp;
};

// --- Utilidades ---
function formatearFechaEvento(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "Fecha inválida";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(fecha);
}

// --- Componente Principal ---
export function EventosScreen({ navigation }: EventosScreenProps) {
  // Estado general
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crearEventoModalVisible, setCrearEventoModalVisible] = useState(false);

  const cargarEventos = useCallback(async () => {
    try {
      const response = await apiClient.get<Evento[]>("/api/eventos");
      setEventos(response.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingEventos(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const inicializar = async () => {
      try {
        const tokenActivo = await apiClient.getToken();
        if (isMounted && tokenActivo) {
          setLoadingEventos(true);
          await cargarEventos();
        } else if (isMounted) {
          setError("No hay sesión activa. Inicia sesión para ver eventos.");
          setLoadingEventos(false);
        }
      } catch {
        if (isMounted) {
          setError("Error al leer la sesión local.");
          setLoadingEventos(false);
        }
      }
    };

    inicializar();
    return () => { isMounted = false; };
  }, [cargarEventos]);

  const handleEventoSuccess = async () => {
    await cargarEventos();
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.headerWithButton}>
          <View style={styles.headerText}>
            <Text style={styles.title}>UniConnect</Text>
            <Text style={styles.subtitle}>Eventos</Text>
            <Text style={styles.caption}>Comunidad Universidad de Caldas</Text>
          </View>
          <Pressable
            style={styles.createButton}
            onPress={() => setCrearEventoModalVisible(true)}
          >
            <Text style={styles.createButtonText}>+ Crear</Text>
          </Pressable>
        </View>

        {loadingEventos && <ActivityIndicator color={theme.colors.primary} size="large" />}
        {error && <Text style={styles.error}>Error: {error}</Text>}

        {!loadingEventos && !error && (
          <ScrollView contentContainerStyle={styles.list} style={styles.scrollView}>
            {eventos.map((evento) => (
              <View key={evento.id} style={styles.card}>
                <Text style={styles.eventTitle}>{evento.titulo}</Text>
                <Text style={styles.eventDate}>{formatearFechaEvento(evento.fechaEvento)}</Text>
                <Text style={styles.eventDescription}>{evento.descripcion}</Text>
                <Text style={styles.eventLocation}>Lugar: {evento.lugar?.trim() || "Por definir"}</Text>
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
      </View>

      <Pressable style={styles.navButton} onPress={() => navigation.navigate("Grupos")}>
        <Text style={styles.navButtonText}>Ver Mis Grupos</Text>
      </Pressable>

      <CrearEventoModal
        visible={crearEventoModalVisible}
        onClose={() => setCrearEventoModalVisible(false)}
        onSuccess={handleEventoSuccess}
      />
    </View>
  );
}