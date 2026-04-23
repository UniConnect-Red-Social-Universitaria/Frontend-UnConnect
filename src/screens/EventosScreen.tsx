import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import io, { Socket } from "socket.io-client";
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

type CategoriaEvento = "academico" | "cultural" | "deportivo" | "otro";
const CATEGORIAS: { value: CategoriaEvento | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "academico", label: "Académico" },
  { value: "cultural", label: "Cultural" },
  { value: "deportivo", label: "Deportivo" },
  { value: "otro", label: "Otro" },
];

type Evento = {
  id: string;
  titulo: string;
  descripcion: string;
  lugar?: string | null;
  fechaEvento: string;
  categoria: CategoriaEvento;
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

// --- Utilidades (Añadidas por tu compañero) ---
function extraerHostDesdeHostUri(hostUri: string): string | null {
  const valor = hostUri.trim();
  if (!valor) return null;
  if (/^[a-z]+:\/\//i.test(valor)) {
    try {
      const url = new URL(valor);
      return url.hostname || null;
    } catch {
      return null;
    }
  }
  if (valor.startsWith("[")) {
    const fin = valor.indexOf("]");
    return fin > 1 ? valor.slice(1, fin) : null;
  }
  const partes = valor.split(":");
  if (partes.length >= 2) return partes[0] || null;
  return valor;
}

function esHostLanValido(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = m.slice(1).map(Number);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function obtenerHostExpo(): string | null {
  const cfg = Constants.expoConfig as { hostUri?: string } | null;
  if (cfg?.hostUri) return cfg.hostUri;
  const c = Constants as unknown as {
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };
  return c.manifest2?.extra?.expoClient?.hostUri ?? null;
}

function resolverApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  const configured = raw?.trim().replace(/\/+$/, "") ?? "";
  if (configured) return configured;
  const hostUri = obtenerHostExpo();
  if (hostUri) {
    const host = extraerHostDesdeHostUri(hostUri);
    if (host && esHostLanValido(host)) {
      const norm = host.includes(":") ? `[${host}]` : host;
      return `http://${norm}:3000`;
    }
  }
  if (Platform.OS === "android") return "http://10.0.2.2:3000";
  return "http://localhost:3000";
}

function formatearFechaEvento(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "Fecha inválida";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(fecha);
}

function badgeCategoria(cat: CategoriaEvento): string {
  const map: Record<CategoriaEvento, string> = {
    academico: "Académico",
    cultural: "Cultural",
    deportivo: "Deportivo",
    otro: "Otro",
  };
  return map[cat] ?? cat;
}

// --- Componente Principal ---
export function EventosScreen({ navigation }: EventosScreenProps) {
  // Estados combinados (Tus modales + Los filtros/sockets de tu compañero)
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crearEventoModalVisible, setCrearEventoModalVisible] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<CategoriaEvento | "todas">("todas");
  const [categoriasSuscritas, setCategoriasSuscritas] = useState<Set<CategoriaEvento>>(new Set());
  const [notificacionObserver, setNotificacionObserver] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const apiBaseUrl = resolverApiBaseUrl();

  const cargarEventos = useCallback(async (categoria?: CategoriaEvento | "todas") => {
    try {
      const url = categoria && categoria !== "todas" 
        ? `/api/eventos?categoria=${categoria}` 
        : "/api/eventos";
        
      const response = await apiClient.get<Evento[]>(url);
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

          // Configuración de WebSockets (Añadido por tu compañero)
          socketRef.current = io(apiBaseUrl, {
            auth: { token: tokenActivo },
            transports: ["websocket"],
          });

          socketRef.current.on("evento:nuevo:categoria", (evento: Evento) => {
            setNotificacionObserver(
              `Nuevo evento "${evento.titulo}" en categoría ${badgeCategoria(evento.categoria)}`
            );
            setTimeout(() => setNotificacionObserver(null), 5000);
          });

          await cargarEventos(filtroActivo);
        } else if (isMounted) {
          setError("No hay sesión activa. Inicia sesión para ver eventos.");
          setLoadingEventos(false);
        }
      } catch {
        if (isMounted) {
          setError("Error al inicializar la pantalla.");
          setLoadingEventos(false);
        }
      }
    };

    inicializar();
    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
    };
  }, [apiBaseUrl, cargarEventos, filtroActivo]);

  const aplicarFiltro = async (cat: CategoriaEvento | "todas") => {
    setFiltroActivo(cat);
    setLoadingEventos(true);
    await cargarEventos(cat);
  };

  const toggleSuscripcion = async (categoria: CategoriaEvento) => {
    const estaSuscrito = categoriasSuscritas.has(categoria);
    try {
      // Adaptado para usar tu apiClient
      if (estaSuscrito) {
        await apiClient.delete(`/api/eventos/suscripciones/${categoria}`);
      } else {
        await apiClient.post(`/api/eventos/suscripciones`, { categoria });
      }
      
      setCategoriasSuscritas((prev) => {
        const next = new Set(prev);
        estaSuscrito ? next.delete(categoria) : next.add(categoria);
        return next;
      });
    } catch {
      // silencioso — no crítico para la navegación
    }
  };

  const handleEventoSuccess = async () => {
    await cargarEventos(filtroActivo);
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
        </View>

        {notificacionObserver && (
          <View style={styles.observerBanner}>
            <Text style={styles.observerBannerText}>🔔 {notificacionObserver}</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Publicar evento</Text>
          {/* Botón limpio y modal que tú creaste */}
          <Pressable
            style={styles.createButton}
            onPress={() => setCrearEventoModalVisible(true)}
          >
            <Text style={styles.createButtonText}>+ Crear</Text>
          </Pressable>
        </View>

        {/* Sección de Filtros de tu compañero */}
        <View style={styles.filtroSection}>
          <Text style={styles.filtroLabel}>Filtrar por categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {CATEGORIAS.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => aplicarFiltro(cat.value)}
                style={[styles.chip, filtroActivo === cat.value && styles.chipActivo]}
              >
                <Text style={[styles.chipText, filtroActivo === cat.value && styles.chipTextoActivo]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {filtroActivo !== "todas" && (
            <View style={styles.suscripcionRow}>
              <Text style={styles.suscripcionLabel}>
                {categoriasSuscritas.has(filtroActivo as CategoriaEvento)
                  ? "✓ Suscrito a esta categoría"
                  : "Recibir notificaciones de esta categoría"}
              </Text>
              <Pressable
                onPress={() => toggleSuscripcion(filtroActivo as CategoriaEvento)}
                style={[
                  styles.suscripcionBtn,
                  categoriasSuscritas.has(filtroActivo as CategoriaEvento) && styles.suscripcionBtnActivo,
                ]}
              >
                <Text style={styles.suscripcionBtnText}>
                  {categoriasSuscritas.has(filtroActivo as CategoriaEvento) ? "Desuscribirse" : "Suscribirse"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {loadingEventos && <ActivityIndicator color={theme.colors.primary} size="large" />}
        {error && <Text style={styles.error}>Error: {error}</Text>}

        {!loadingEventos && !error && (
          <ScrollView contentContainerStyle={styles.list} style={styles.scrollView}>
            {eventos.map((evento) => (
              <View key={evento.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.eventTitle}>{evento.titulo}</Text>
                  <View style={styles.categoriaBadge}>
                    <Text style={styles.categoriaBadgeText}>
                      {badgeCategoria(evento.categoria)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.eventDate}>{formatearFechaEvento(evento.fechaEvento)}</Text>
                <Text style={styles.eventDescription}>{evento.descripcion}</Text>
                <Text style={styles.eventLocation}>
                  Lugar: {evento.lugar?.trim() || "Por definir"}
                </Text>
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