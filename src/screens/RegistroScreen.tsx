import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { globalStyles } from "../styles/global";
import { useRegistroScreenStyles } from "./RegistroScreen.styles";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export default function RegistroScreen({ navigation }: any) {
  const styles = useRegistroScreenStyles();
  const [estaCargando, setEstaCargando] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ["profile", "email"]
  });

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
    setEstaCargando(true);
    promptAsync();
  };

  return (
    <View style={globalStyles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/logo-caldas.png")}
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
