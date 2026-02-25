import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { globalStyles } from "../styles/global";
import { useRegistroScreenStyles } from "./RegistroScreen.styles";

WebBrowser.maybeCompleteAuthSession();

export default function RegistroScreen({ navigation }: any) {
  const styles = useRegistroScreenStyles();
  const [estaCargando, setEstaCargando] = useState(false);

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleExpoClientId =
    process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || googleWebClientId;
  const googleAndroidClientIdFinal =
    googleAndroidClientId?.trim() || googleExpoClientId?.trim() || googleWebClientId?.trim();
  const googleIosClientIdFinal =
    googleIosClientId?.trim() || googleExpoClientId?.trim() || googleWebClientId?.trim();
  const esExpoGo = Constants.appOwnership === "expo";

  const googleAuthConfig: Google.GoogleAuthRequestConfig = {
    webClientId: googleWebClientId,
    expoClientId: googleExpoClientId,
    scopes: ["profile", "email"],
  };

  if (googleIosClientIdFinal) {
    googleAuthConfig.iosClientId = googleIosClientIdFinal;
  }
  if (googleAndroidClientIdFinal) {
    googleAuthConfig.androidClientId = googleAndroidClientIdFinal;
  }

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleAuthConfig);

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken =
        response.authentication?.idToken || response.params?.id_token;

      if (idToken) {
        obtenerDatosUsuario(idToken);
      } else {
        setEstaCargando(false);
        console.log("Respuesta de Google sin token:", response);
        Alert.alert("Error", "Google inició sesión pero no devolvió el token.");
      }
    } else if (response.type === "error") {
      setEstaCargando(false);
      Alert.alert("Error", "No se pudo conectar con Google.");
      console.log("Error de Google:", response.error);
    } else if (response.type === "dismiss" || response.type === "cancel") {
      setEstaCargando(false);
      console.log("El usuario canceló el inicio de sesión.");
    }
  }, [response]);

  const obtenerDatosUsuario = async (idToken: string) => {
    try {
      const userInfoResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );

      const userInfo = await userInfoResponse.json();

      if (!userInfo.email.endsWith("@ucaldas.edu.co")) {
        setEstaCargando(false);
        Alert.alert(
          "Acceso denegado",
          "Por favor, utiliza exclusivamente tu correo institucional (@ucaldas.edu.co).",
        );
        return;
      }

      const googleDataReal = {
        nombre: userInfo.given_name || "",
        apellido: userInfo.family_name || "",
        correo: userInfo.email,
        googleIdToken: idToken,
      };

      console.log("¡Login con Google exitoso!", googleDataReal.correo);
      setEstaCargando(false);

      navigation.navigate("CompletarRegistro", {
        googleData: googleDataReal,
      });
    } catch (error) {
      console.error("Error obteniendo datos de Google:", error);
      Alert.alert("Error", "No pudimos obtener tu información de Google.");
      setEstaCargando(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!googleWebClientId?.trim()) {
      Alert.alert(
        "Configuración faltante",
        "Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en el .env.",
      );
      return;
    }

    if (esExpoGo && !googleExpoClientId?.trim()) {
      Alert.alert(
        "Configuración faltante",
        "Falta EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID en el .env para usar Google en Expo Go.",
      );
      return;
    }

    if (Platform.OS === "android" && !googleAndroidClientIdFinal) {
      Alert.alert(
        "Configuración faltante",
        "Falta configuración de Google para Android en el .env.",
      );
      return;
    }

    if (Platform.OS === "ios" && !googleIosClientIdFinal) {
      Alert.alert(
        "Configuración faltante",
        "Falta configuración de Google para iOS en el .env.",
      );
      return;
    }

    setEstaCargando(true);
    promptAsync(esExpoGo ? { useProxy: true } : undefined);
  };

  return (
    <View style={globalStyles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/logo-caldas.png')}
          style={styles.logo}
        />

        <Text style={styles.title}>Registro Institucional</Text>

        <Text style={styles.subtitle}>
          Para unirte a UniConnect, es necesario ingresar exclusivamente con tu
          cuenta de correo institucional de la Universidad de Caldas.
        </Text>

        <TouchableOpacity
          style={[styles.googleButton, estaCargando && { opacity: 0.7 }]}
          onPress={handleGoogleLogin}
          disabled={!request || estaCargando}
        >
          {estaCargando ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={estaCargando}
        >
          <Text style={styles.backButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
