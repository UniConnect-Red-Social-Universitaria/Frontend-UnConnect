import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import Constants from "expo-constants";
import { globalStyles } from "../styles/global";
import theme from "../styles/theme";
import { useLoginStyles } from "./LoginScreen.styles";

const AUTH_TOKEN_STORAGE_KEY = "uniconnect_auth_token";

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

export default function LoginScreen({ navigation }: any) {
  const styles = useLoginStyles();

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [estaCargando, setEstaCargando] = useState(false);

  const [errorGeneral, setErrorGeneral] = useState("");

  const [errores, setErrores] = useState({
    correo: "",
    contrasena: "",
  });

  const validarFormulario = () => {
    let nuevosErrores = { correo: "", contrasena: "" };
    let esValido = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim() || !emailRegex.test(correo)) {
      nuevosErrores.correo = "Ingresa un correo válido.";
      esValido = false;
    }

    if (contrasena.trim().length === 0) {
      nuevosErrores.contrasena = "La contraseña es obligatoria.";
      esValido = false;
    }

    setErrores(nuevosErrores);
    return esValido;
  };

  const handleLogin = async () => {
    setErrorGeneral("");

    if (!validarFormulario()) return;

    setEstaCargando(true);

    try {
      const apiBaseUrl = resolverApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo: correo.trim(), contrasena }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const mensaje =
          typeof payload?.message === "string"
            ? payload.message
            : "Correo o contraseña incorrectos, intenta de nuevo.";
        throw new Error(mensaje);
      }

      const tokenSesion =
        typeof payload?.data?.token === "string"
          ? payload.data.token.trim()
          : "";

      if (!tokenSesion) {
        throw new Error("No se recibió un token de sesión válido.");
      }

      await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, tokenSesion);

      navigation.reset({
        index: 0,
        routes: [{ name: "Principal" }],
      });
    } catch (error: any) {
      console.error("Error en el login:", error);
      setErrorGeneral(
        error.message || "Ocurrió un problema de conexión. Intenta de nuevo.",
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
          <Image
            source={require("../../assets/images/logo-caldas.png")}
            style={[globalStyles.logoImage, styles.logoPropio]}
          />

          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitle}>
            Inicia sesión para continuar en UniConnect
          </Text>

          <View style={styles.formContainer}>
            {/* Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={[
                  styles.input,
                  errores.correo
                    ? { borderColor: "red", borderWidth: 1 }
                    : null,
                ]}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={theme.colors.primaryMid}
                keyboardType="email-address"
                autoCapitalize="none"
                value={correo}
                onChangeText={(text) => {
                  setCorreo(text);
                  setErrores({ ...errores, correo: "" });
                  setErrorGeneral("");
                }}
                editable={!estaCargando}
              />
              {errores.correo ? (
                <Text style={styles.errorText}>{errores.correo}</Text>
              ) : null}
            </View>

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
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={theme.colors.primaryMid}
                secureTextEntry
                value={contrasena}
                onChangeText={(text) => {
                  setContrasena(text);
                  setErrores({ ...errores, contrasena: "" });
                  setErrorGeneral("");
                }}
                editable={!estaCargando}
              />
              {errores.contrasena ? (
                <Text style={styles.errorText}>{errores.contrasena}</Text>
              ) : null}
            </View>
          </View>

          {errorGeneral ? (
            <View style={styles.errorGeneralContainer}>
              <Text style={styles.errorGeneralText}>{errorGeneral}</Text>
            </View>
          ) : null}

          {/* Botones y Enlaces */}
          <View style={styles.buttonsContainer}>
            <Pressable
              style={[
                styles.button,
                styles.buttonPrimary,
                hoveredButton === "login" &&
                  !estaCargando &&
                  styles.buttonPrimaryHover,
                estaCargando && { opacity: 0.7 },
              ]}
              onPress={handleLogin}
              onPressIn={() => setHoveredButton("login")}
              onPressOut={() => setHoveredButton(null)}
              disabled={estaCargando}
            >
              {estaCargando ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.buttonPrimaryText}>Iniciar Sesión</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => !estaCargando && navigation.navigate("Registro")}
              onPressIn={() => setHoveredButton("registro")}
              onPressOut={() => setHoveredButton(null)}
              disabled={estaCargando}
            >
              <Text
                style={[
                  styles.buttonSecondaryText,
                  hoveredButton === "registro" &&
                    !estaCargando && {
                      textDecorationLine: "underline",
                    },
                ]}
              >
                ¿No tienes una cuenta? Regístrate aquí
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
