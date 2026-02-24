import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import Constants from "expo-constants";
import { globalStyles } from "../styles/global";
import theme from "../styles/theme";
import { useCompletarRegistroStyles } from "./CompletarRegistroScreen.styles";

function extraerHostDesdeHostUri(hostUri: string): string | null {
  const valor = hostUri.trim();
  if (!valor) return null;
  if (/^[a-z]+:\/\//i.test(valor)) {
    try {
      return new URL(valor).hostname || null;
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
  const hostNormalizado = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostNormalizado === "localhost" || hostNormalizado.endsWith(".local"))
    return true;
  const matchIpv4 = hostNormalizado.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
  );
  if (!matchIpv4) return false;
  const octetos = matchIpv4.slice(1).map(Number);
  if (
    octetos.some((octeto) => Number.isNaN(octeto) || octeto < 0 || octeto > 255)
  )
    return false;
  const [a, b] = octetos;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function obtenerHostExpo(): string | null {
  const configExpo = Constants.expoConfig as { hostUri?: string } | null;
  if (configExpo?.hostUri) return configExpo.hostUri;
  const constantsConManifest = Constants as unknown as {
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };
  return constantsConManifest.manifest2?.extra?.expoClient?.hostUri ?? null;
}

function resolverApiBaseUrl(): string {
  const apiUrlConfiguradaRaw = process.env.EXPO_PUBLIC_API_URL;
  const apiUrlConfigurada =
    apiUrlConfiguradaRaw?.trim().replace(/\/+$/, "") ?? "";
  if (apiUrlConfigurada) return apiUrlConfigurada;
  const hostUriExpo = obtenerHostExpo();
  if (hostUriExpo) {
    const hostDetectado = extraerHostDesdeHostUri(hostUriExpo);
    if (hostDetectado && esHostLanValido(hostDetectado)) {
      const hostNormalizado = hostDetectado.includes(":")
        ? `[${hostDetectado}]`
        : hostDetectado;
      return `http://${hostNormalizado}:3000`;
    }
  }
  if (Platform.OS === "android") return "http://10.0.2.2:3000";
  return "http://localhost:3000";
}

export default function CompletarRegistroScreen({ navigation, route }: any) {
  const styles = useCompletarRegistroStyles();
  const { googleData } = route.params || {};

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [contrasena, setContrasena] = useState("");
  const [carrera, setCarrera] = useState("");
  const [semestre, setSemestre] = useState("");
  const [materias, setMaterias] = useState("");

  const [estaCargando, setEstaCargando] = useState(false);

  const [errores, setErrores] = useState({
    contrasena: "",
    carrera: "",
    semestre: "",
    materias: "",
  });

  const validarFormulario = () => {
    let nuevosErrores = {
      contrasena: "",
      carrera: "",
      semestre: "",
      materias: "",
    };
    let esValido = true;

    if (contrasena.trim().length < 8) {
      nuevosErrores.contrasena =
        "La contraseña debe tener al menos 8 caracteres.";
      esValido = false;
    }
    if (carrera.trim() === "") {
      nuevosErrores.carrera = "La carrera es obligatoria.";
      esValido = false;
    }
    const semestreNum = parseInt(semestre);
    if (
      !semestre.trim() ||
      isNaN(semestreNum) ||
      semestreNum < 1 ||
      semestreNum > 20
    ) {
      nuevosErrores.semestre = "Ingresa un número de semestre válido.";
      esValido = false;
    }
    if (materias.trim() === "") {
      nuevosErrores.materias = "Debes ingresar al menos una materia.";
      esValido = false;
    }

    setErrores(nuevosErrores);
    return esValido;
  };

  const handleFinalizarRegistro = async () => {
    if (!validarFormulario()) return;

    const materiasArray = materias
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m !== "");

    const datosCompletos = {
      nombre: googleData?.nombre || "",
      apellido: googleData?.apellido || "",
      correo: googleData?.correo || "",
      googleIdToken: googleData?.googleIdToken || "",
      contrasena: contrasena,
      carrera: carrera,
      semestre: parseInt(semestre),
      materiasCursando: materiasArray,
    };

    setEstaCargando(true);

    try {
      const apiBaseUrl = resolverApiBaseUrl();
      console.log(`Enviando registro a: ${apiBaseUrl}/api/usuarios/registro`);

      const response = await fetch(`${apiBaseUrl}/api/usuarios/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosCompletos),
      });

      const payload = await response.json();

      if (!response.ok) {
        const mensaje =
          typeof payload?.message === "string"
            ? payload.message
            : `HTTP Error ${response.status}`;
        throw new Error(mensaje);
      }

      Alert.alert(
        "¡Bienvenido a UniConnect!",
        "Tu cuenta ha sido creada exitosamente.",
        [
          {
            text: "OK",
            // Aquí puedes redirigir al Login o al Inicio
            onPress: () => console.log("Redirigir al inicio o login"),
          },
        ],
      );
    } catch (error: any) {
      console.error("Error en el registro:", error);
      Alert.alert(
        "Error al registrar",
        error.message || "Ocurrió un problema de conexión.",
      );
    } finally {
      setEstaCargando(false);
    }
  };

  return (
    <View style={globalStyles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Completa tu perfil</Text>
          <Text style={styles.subtitle}>
            Necesitamos algunos datos académicos para terminar tu registro en
            UniConnect.
          </Text>

          <View style={styles.formContainer}>
            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={[
                  styles.input,
                  errores.contrasena
                    ? { borderColor: "red", borderWidth: 1 }
                    : null,
                ]}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={theme.colors.primaryMid}
                secureTextEntry
                value={contrasena}
                onChangeText={(text) => {
                  setContrasena(text);
                  setErrores({ ...errores, contrasena: "" });
                }}
                editable={!estaCargando}
              />
              {errores.contrasena ? (
                <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                  {errores.contrasena}
                </Text>
              ) : null}
            </View>

            {/* Carrera */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Carrera</Text>
              <TextInput
                style={[
                  styles.input,
                  errores.carrera
                    ? { borderColor: "red", borderWidth: 1 }
                    : null,
                ]}
                placeholder="Ej. Ingeniería de Sistemas"
                placeholderTextColor={theme.colors.primaryMid}
                value={carrera}
                onChangeText={(text) => {
                  setCarrera(text);
                  setErrores({ ...errores, carrera: "" });
                }}
                editable={!estaCargando}
              />
              {errores.carrera ? (
                <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                  {errores.carrera}
                </Text>
              ) : null}
            </View>

            {/* Semestre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Semestre actual</Text>
              <TextInput
                style={[
                  styles.input,
                  errores.semestre
                    ? { borderColor: "red", borderWidth: 1 }
                    : null,
                ]}
                placeholder="Ej. 5"
                placeholderTextColor={theme.colors.primaryMid}
                keyboardType="numeric"
                value={semestre}
                onChangeText={(text) => {
                  setSemestre(text);
                  setErrores({ ...errores, semestre: "" });
                }}
                editable={!estaCargando}
              />
              {errores.semestre ? (
                <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                  {errores.semestre}
                </Text>
              ) : null}
            </View>

            {/* Materias */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Materias que estás cursando</Text>
              <TextInput
                style={[
                  styles.input,
                  errores.materias
                    ? { borderColor: "red", borderWidth: 1 }
                    : null,
                ]}
                placeholder="Ej. Cálculo, Programación II"
                placeholderTextColor={theme.colors.primaryMid}
                value={materias}
                onChangeText={(text) => {
                  setMaterias(text);
                  setErrores({ ...errores, materias: "" });
                }}
                editable={!estaCargando}
              />
              {errores.materias ? (
                <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                  {errores.materias}
                </Text>
              ) : (
                <Text style={styles.inputHint}>
                  Separa cada materia con una coma
                </Text>
              )}
            </View>
          </View>

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            <Pressable
              style={[
                styles.button,
                styles.buttonPrimary,
                hoveredButton === "finalizar" &&
                  !estaCargando &&
                  styles.buttonPrimaryHover,
                estaCargando && { opacity: 0.7 },
              ]}
              onPress={handleFinalizarRegistro}
              onPressIn={() => setHoveredButton("finalizar")}
              onPressOut={() => setHoveredButton(null)}
              disabled={estaCargando}
            >
              {estaCargando ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.buttonPrimaryText}>Finalizar Registro</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => !estaCargando && navigation.goBack()}
              onPressIn={() => setHoveredButton("volver")}
              onPressOut={() => setHoveredButton(null)}
              disabled={estaCargando}
            >
              <Text
                style={[
                  styles.buttonSecondaryText,
                  hoveredButton === "volver" &&
                    !estaCargando && {
                      textDecorationLine: "underline",
                    },
                ]}
              >
                Volver
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
