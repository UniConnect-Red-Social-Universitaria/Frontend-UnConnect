import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
WebBrowser.maybeCompleteAuthSession();
const ALLOWED_DOMAIN = "ucaldas.edu.co";
export function useGoogleAuth() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
  const googleIosScheme = iosClientId
    ? `com.googleusercontent.apps.${iosClientId.replace(
        ".apps.googleusercontent.com",
        "",
      )}`
    : null;
  const redirectUri = Platform.select({
    ios: googleIosScheme ? `${googleIosScheme}:/oauthredirect` : undefined,
    default: AuthSession.makeRedirectUri({
      scheme: "com.ucaldas.estudiantes",
      path: "oauthredirect",
    }),
  });
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId,
    androidClientId,
    iosClientId,
    redirectUri,
    // Forzar dominio institucional
    extraParams: {
      hd: ALLOWED_DOMAIN, // hd = hosted domain
    },
    scopes: ["openid", "profile", "email"],
  });
  const signIn = () => {
    if (!iosClientId || !androidClientId || !webClientId) {
      setError("Faltan client IDs de Google en .env");
      return;
    }
    console.log("OAuth redirectUri:", redirectUri);
    setError(null);
    promptAsync();
  };
  useEffect(() => {
    if (response?.type === "success") {
      fetchUserInfo(response.authentication.accessToken);
    }
    if (response?.type === "error") {
      const oauthError =
        response?.params?.error_description ||
        response?.params?.error ||
        "Solicitud OAuth inválida";
      setError(`Google OAuth: ${oauthError}`);
    }
    if (response?.type === "dismiss" || response?.type === "cancel") {
      setError("Inicio de sesión cancelado.");
    }
  }, [response]);
  const fetchUserInfo = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Validar que sea cuenta @ucaldas.edu.co
      if (!data.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        setError("Solo se permiten cuentas @ucaldas.edu.co");
        return;
      }
      setUser(data);
    } catch (e) {
      setError("Error al obtener información del usuario");
    } finally {
      setLoading(false);
    }
  };
  const signOut = () => setUser(null);
  return { user, error, loading, request, signIn, signOut };
}
