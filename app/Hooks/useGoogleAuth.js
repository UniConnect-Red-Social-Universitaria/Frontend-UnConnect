import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const allowedDomain =
    process.env.EXPO_PUBLIC_ALLOWED_DOMAIN || "ucaldas.edu.co";
  const auth0Domain = (process.env.EXPO_PUBLIC_AUTH0_DOMAIN || "").replace(
    /^https?:\/\//,
    "",
  );
  const auth0ClientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID;
  const auth0Connection =
    process.env.EXPO_PUBLIC_AUTH0_CONNECTION || "google-oauth2";

  const redirectUri = useMemo(() => {
    if (Platform.OS === "web") {
      return window.location.origin;
    }

    const isExpoGo =
      Constants.executionEnvironment === "storeClient" ||
      Constants.appOwnership === "expo" ||
      Constants.appOwnership === "guest";

    if (isExpoGo) {
      const appOwner = Constants.expoConfig?.owner || "jackeliner";
      const appSlug = Constants.expoConfig?.slug || "uniconnect-app";
      return AuthSession.makeRedirectUri({
        useProxy: true,
        projectNameForProxy: `@${appOwner}/${appSlug}`,
      });
    }

    return AuthSession.makeRedirectUri({
      scheme: "com.jackeliner.uniconnectapp",
      path: "auth0-callback",
    });
  }, []);

  const discovery = useMemo(() => {
    if (!auth0Domain) return null;
    return {
      authorizationEndpoint: `https://${auth0Domain}/authorize`,
      tokenEndpoint: `https://${auth0Domain}/oauth/token`,
      revocationEndpoint: `https://${auth0Domain}/oauth/revoke`,
      userInfoEndpoint: `https://${auth0Domain}/userinfo`,
    };
  }, [auth0Domain]);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: auth0ClientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      scopes: ["openid", "profile", "email"],
      extraParams: {
        connection: auth0Connection,
        prompt: "login",
      },
    },
    discovery,
  );

  const fetchUserInfo = useCallback(
    async (accessToken, idToken) => {
      try {
        const responseUser = await fetch(`https://${auth0Domain}/userinfo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const profile = await responseUser.json();

        if (!profile.email?.endsWith(`@${allowedDomain}`)) {
          setError(
            `Acceso denegado. Solo se permiten cuentas @${allowedDomain}`,
          );
          setUser(null);
          return;
        }

        setUser({
          id: profile.sub,
          name: profile.name,
          given_name: profile.given_name,
          family_name: profile.family_name,
          email: profile.email,
          picture: profile.picture,
          idToken: idToken,
        });
      } catch (err) {
        throw new Error("Error al obtener el perfil del usuario.");
      }
    },
    [allowedDomain, auth0Domain],
  );

  const exchangeCodeForToken = useCallback(
    async (code, codeVerifier) => {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: auth0ClientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      });

      const tokenRes = await fetch(`https://${auth0Domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const tokenJson = await tokenRes.json();

      if (!tokenRes.ok || !tokenJson.access_token) {
        throw new Error(
          tokenJson.error_description ||
            tokenJson.error ||
            "No se pudo obtener el token.",
        );
      }

      return {
        accessToken: tokenJson.access_token,
        idToken: tokenJson.id_token,
      };
    },
    [auth0ClientId, auth0Domain, redirectUri],
  );

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === "success") {
        setLoading(true);
        setError(null);
        try {
          const code = response.params?.code;
          if (!code || !request?.codeVerifier) {
            setError("Auth0 no devolvió código válido.");
            return;
          }

          const tokens = await exchangeCodeForToken(code, request.codeVerifier);
          await fetchUserInfo(tokens.accessToken, tokens.idToken);
        } catch (err) {
          setError(err.message || "Error al procesar el inicio de sesión.");
        } finally {
          setLoading(false);
        }
      } else if (response?.type === "error") {
        setError(
          response.params?.error_description || "Error en la autenticación.",
        );
      } else if (response?.type === "dismiss" || response?.type === "cancel") {
        setError("Inicio de sesión cancelado.");
      }
    };

    if (response) {
      handleResponse();
    }
  }, [response, exchangeCodeForToken, fetchUserInfo, request]);

  const signIn = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      if (!auth0Domain || !auth0ClientId) {
        setError("Falta configurar Auth0 en .env");
        setLoading(false);
        return;
      }

      if (!request) {
        setError("La solicitud aún no está lista. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      await promptAsync();
    } catch (err) {
      console.error("Sign-In error:", err);
      setError(err.message || "Error inesperado.");
      setLoading(false);
    }
  }, [auth0ClientId, auth0Domain, promptAsync, request, redirectUri]);

  const signOut = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  return { user, error, loading, request, signIn, signOut };
}
