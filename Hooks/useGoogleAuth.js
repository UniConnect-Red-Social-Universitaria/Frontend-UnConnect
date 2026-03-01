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
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
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
      useProxy: true,
    }),
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    androidClientId,
    iosClientId,
    redirectUri,
    extraParams: {
      hd: ALLOWED_DOMAIN,
    },
    scopes: ["profile", "email"],
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
      const idToken =
        response.authentication?.idToken || response.params?.id_token;

      if (idToken) {
        decodificarIdToken(idToken);
      } else {
        setError("Google no devolvió el idToken necesario.");
      }
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

  const decodificarIdToken = (idToken) => {
    try {
      const base64Url = idToken.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const decodedData = JSON.parse(jsonPayload);

      if (!decodedData.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        setError("Solo se permiten cuentas @ucaldas.edu.co");
        return;
      }

      setUser({
        email: decodedData.email,
        given_name: decodedData.given_name,
        family_name: decodedData.family_name,
        picture: decodedData.picture,
        idToken: idToken,
      });
    } catch (e) {
      setError("Error al procesar el token de Google");
      console.error(e);
    }
  };

  const signOut = () => setUser(null);

  return { user, error, loading, request, signIn, signOut };
}
