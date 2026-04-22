import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import io, { Socket } from "socket.io-client";
import theme from "../styles/theme";

type RootStackParamList = {
  Eventos: undefined;
  Grupos: undefined;
};

type EventosScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Eventos"
>;

const REQUEST_TIMEOUT_MS = 10000;
const AUTH_TOKEN_STORAGE_KEY = "userToken";

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

type EventosScreenProps = {
  navigation: EventosScreenNavigationProp;
};

export function EventosScreen({ navigation }: EventosScreenProps) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajePublicacion, setMensajePublicacion] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [lugar, setLugar] = useState("");
  const [fechaEventoInput, setFechaEventoInput] = useState("");
  const [categoriaForm, setCategoriaForm] = useState<CategoriaEvento>("otro");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<CategoriaEvento | "todas">("todas");
  const [categoriasSuscritas, setCategoriasSuscritas] = useState<Set<CategoriaEvento>>(new Set());
  const [notificacionObserver, setNotificacionObserver] = useState<string | null>(null);
  const [token, setToken] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const apiBaseUrl = resolverApiBaseUrl();

  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);
  const handleConfirmDate = (date: Date) => {
    setFechaEventoInput(date.toISOString());
    hideDatePicker();
  };

  const cargarEventos = useCallback(
    async (jwt: string, categoria?: CategoriaEvento | "todas") => {
      if (!apiBaseUrl.trim()) {
        setError("No se pudo resolver la URL del backend.");
        setLoadingEventos(false);
        return;
      }
      if (!jwt.trim()) {
        setError("No hay sesion activa.");
        setLoadingEventos(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const url =
          categoria && categoria !== "todas"
            ? `${apiBaseUrl}/api/eventos?categoria=${categoria}`
            : `${apiBaseUrl}/api/eventos`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${jwt.trim()}` },
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            typeof body?.message === "string" ? body.message : `HTTP ${response.status}`
          );
        }

        const payload = await response.json();
        setEventos(payload.data ?? []);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setError(`Tiempo de espera agotado conectando a ${apiBaseUrl}`);
        } else {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        clearTimeout(timeoutId);
        setLoadingEventos(false);
      }
    },
    [apiBaseUrl]
  );

  useEffect(() => {
    let isMounted = true;
    const cargarTokenGuardado = async () => {
      try {
        const tokenGuardado = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        if (isMounted && tokenGuardado?.trim()) {
          const jwt = tokenGuardado.trim();
          setToken(jwt);
          setLoadingEventos(true);

          socketRef.current = io(apiBaseUrl, {
            auth: { token: jwt },
            transports: ["websocket"],
          });

          socketRef.current.on("evento:nuevo:categoria", (evento: Evento) => {
            setNotificacionObserver(
              `Nuevo evento "${evento.titulo}" en categoría ${badgeCategoria(evento.categoria)}`
            );
            setTimeout(() => setNotificacionObserver(null), 5000);
          });

          await cargarEventos(jwt);
        } else if (isMounted) {
          setError("No hay sesion activa. Inicia sesion para ver eventos.");
          setLoadingEventos(false);
        }
      } catch {
        if (isMounted) {
          setLoadingEventos(false);
        }
      }
    };

    cargarTokenGuardado();
    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
    };
  }, [apiBaseUrl, cargarEventos]);

  const aplicarFiltro = async (cat: CategoriaEvento | "todas") => {
    setFiltroActivo(cat);
    setLoadingEventos(true);
    await cargarEventos(token, cat);
  };

  const toggleSuscripcion = async (categoria: CategoriaEvento) => {
    if (!token) return;
    const estaSuscrito = categoriasSuscritas.has(categoria);
    const method = estaSuscrito ? "DELETE" : "POST";
    const url = estaSuscrito
      ? `${apiBaseUrl}/api/eventos/suscripciones/${categoria}`
      : `${apiBaseUrl}/api/eventos/suscripciones`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: method === "POST" ? JSON.stringify({ categoria }) : undefined,
      });

      if (response.ok) {
        setCategoriasSuscritas((prev) => {
          const next = new Set(prev);
          estaSuscrito ? next.delete(categoria) : next.add(categoria);
          return next;
        });
      }
    } catch {
      // silencioso — no crítico para la navegación
    }
  };

  const publicarEvento = async () => {
    if (!titulo.trim()) { setMensajePublicacion("Debes escribir un título."); return; }
    if (!descripcion.trim()) { setMensajePublicacion("Debes escribir una descripción."); return; }
    if (!lugar.trim()) { setMensajePublicacion("Debes escribir el lugar del evento."); return; }
    if (!fechaEventoInput.trim()) { setMensajePublicacion("Debes seleccionar la fecha del evento."); return; }
    if (!token.trim()) { setMensajePublicacion("No hay sesión activa."); return; }

    const fecha = new Date(fechaEventoInput.trim());
    if (Number.isNaN(fecha.getTime())) { setMensajePublicacion("Fecha con formato inválido."); return; }
    if (fecha <= new Date()) { Alert.alert("Fecha invalida", "La fecha del evento debe ser futura."); return; }

    setPublicando(true);
    setMensajePublicacion(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/eventos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          lugar: lugar.trim(),
          fechaEvento: fecha.toISOString(),
          categoria: categoriaForm,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload?.message === "string" ? payload.message : `HTTP ${response.status}`);
      }

      setTitulo("");
      setDescripcion("");
      setLugar("");
      setFechaEventoInput("");
      setCategoriaForm("otro");
      setMensajePublicacion("Evento publicado correctamente.");
      await cargarEventos(token.trim(), filtroActivo);
    } catch (err) {
      setMensajePublicacion(err instanceof Error ? err.message : "No se pudo publicar el evento.");
    } finally {
      setPublicando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo-caldas.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
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
            value={lugar}
            onChangeText={setLugar}
            placeholder="Lugar"
            placeholderTextColor={theme.colors.primaryMid}
            style={styles.input}
          />

          <Text style={styles.labelCategoria}>Categoría</Text>
          <View style={styles.chipRow}>
            {CATEGORIAS.filter((c) => c.value !== "todas").map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => setCategoriaForm(cat.value as CategoriaEvento)}
                style={[
                  styles.chip,
                  categoriaForm === cat.value && styles.chipActivo,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    categoriaForm === cat.value && styles.chipTextoActivo,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {Platform.OS === "web" ? (
            <input
              type="datetime-local"
              value={fechaEventoInput ? new Date(fechaEventoInput).toISOString().slice(0, 16) : ""}
              onChange={(e) => {
                const value = e.target.value;
                const [date, time] = value.split("T");
                const [year, month, day] = date.split("-");
                const [hour, minute] = time.split(":");
                setFechaEventoInput(
                  new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).toISOString()
                );
              }}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12 }}
            />
          ) : (
            <View>
              <Pressable onPress={showDatePicker} style={styles.input}>
                <Text style={{ color: fechaEventoInput ? theme.colors.primary : theme.colors.primaryMid }}>
                  {fechaEventoInput ? formatearFechaEvento(fechaEventoInput) : "Selecciona la fecha y hora"}
                </Text>
              </Pressable>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                locale="es-CO"
                minimumDate={new Date()}
                pickerContainerStyleIOS={{ backgroundColor: theme.colors.white }}
                pickerStyleIOS={{ backgroundColor: theme.colors.white }}
                textColor={theme.colors.primary}
              />
            </View>
          )}

          {mensajePublicacion && (
            <Text style={styles.formMessage}>{mensajePublicacion}</Text>
          )}

          <Pressable
            onPress={publicarEvento}
            disabled={publicando}
            style={({ pressed }) => [
              styles.button,
              pressed && !publicando ? styles.buttonPressed : null,
              publicando ? styles.buttonDisabled : null,
            ]}
          >
            <Text style={styles.buttonText}>
              {publicando ? "Publicando..." : "Publicar evento"}
            </Text>
          </Pressable>
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  contentWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  scrollView: { width: "100%" },
  header: {
    width: "100%",
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoImage: { width: 50, height: 50 },
  headerText: { flex: 1 },
  title: { fontSize: 30, fontWeight: "700", color: theme.colors.primary },
  subtitle: { fontSize: 20, fontWeight: "600", marginTop: 2, color: theme.colors.primary },
  caption: { fontSize: 13, marginTop: 4, color: theme.colors.primaryMid },
  observerBanner: {
    width: "100%",
    backgroundColor: theme.colors.gold,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  observerBannerText: { color: theme.colors.primaryDark, fontWeight: "600", fontSize: 14 },
  formCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#F5F5F5",
    marginBottom: 16,
  },
  formTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.primary, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.primary,
    backgroundColor: theme.colors.white,
    marginBottom: 10,
  },
  inputMultiline: { minHeight: 84, textAlignVertical: "top" },
  labelCategoria: { fontSize: 13, color: theme.colors.primaryMid, marginBottom: 6, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chipScroll: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primaryMid,
    marginRight: 8,
  },
  chipActivo: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 13, color: theme.colors.primaryMid },
  chipTextoActivo: { color: theme.colors.white, fontWeight: "600" },
  filtroSection: { width: "100%", marginBottom: 12 },
  filtroLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.primary, marginBottom: 8 },
  suscripcionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  suscripcionLabel: { fontSize: 13, color: theme.colors.primaryMid, flex: 1 },
  suscripcionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  suscripcionBtnActivo: { backgroundColor: theme.colors.primary },
  suscripcionBtnText: { fontSize: 13, color: theme.colors.primary, fontWeight: "600" },
  formMessage: { fontSize: 13, color: theme.colors.primaryMid, marginBottom: 8 },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: theme.colors.white, fontSize: 15, fontWeight: "700" },
  list: { gap: 12, paddingBottom: 24, alignItems: "stretch", width: "100%" },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#F5F5F5",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  eventTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.primary, flex: 1 },
  categoriaBadge: {
    backgroundColor: theme.colors.goldLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  categoriaBadgeText: { fontSize: 11, color: theme.colors.primaryDark, fontWeight: "600" },
  eventDate: { fontSize: 14, color: theme.colors.primaryMid, marginTop: 4 },
  eventDescription: { fontSize: 14, color: theme.colors.primary, marginTop: 8, lineHeight: 20 },
  eventLocation: { fontSize: 13, color: theme.colors.primaryMid, marginTop: 8, fontWeight: "600" },
  eventAuthor: { fontSize: 13, color: theme.colors.primaryMid, marginTop: 10, fontWeight: "500" },
  empty: { marginTop: 16, color: theme.colors.primaryMid, textAlign: "center" },
  error: { color: "#b00020", marginBottom: 12, textAlign: "center" },
  navButton: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 0,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    paddingBottom: 44,
    paddingTop: 24,
    minHeight: 80,
  },
  navButtonText: { color: "#ffffff", fontSize: 20, fontWeight: "700" },
});
