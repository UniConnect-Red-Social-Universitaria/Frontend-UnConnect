import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useCallback, useMemo, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const allowedDomain =
    process.env.EXPO_PUBLIC_ALLOWED_DOMAIN || 'ucaldas.edu.co';
  const auth0Domain = (process.env.EXPO_PUBLIC_AUTH0_DOMAIN || '').replace(
    /^https?:\/\//,
    '',
  );
  const auth0ClientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID;
  const auth0Audience = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;
  const auth0Connection =
    process.env.EXPO_PUBLIC_AUTH0_CONNECTION || 'google-oauth2';

  const isExpoGo =
    Constants.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo' ||
    Constants.appOwnership === 'guest';

  const appOwner = Constants.expoConfig?.owner;
  const appSlug = Constants.expoConfig?.slug;
  const projectFullName =
    appOwner && appSlug ? `@${appOwner}/${appSlug}` : null;


  const nativeReturnUrl = AuthSession.makeRedirectUri({
    scheme: 'com.jackeliner.uniconnectapp',
    path: 'auth0-callback',
  });

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'com.jackeliner.uniconnectapp',
  path: 'auth0-callback',
});

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
      scopes: ['openid', 'profile', 'email'],
      extraParams: {
        ...(auth0Audience ? { audience: auth0Audience } : {}),
        ...(auth0Connection ? { connection: auth0Connection } : {}),
        prompt: 'login',
      },
    },
    discovery,
  );

  /**
   * Obtiene el perfil del usuario desde Auth0 userinfo y
   * verifica que el correo sea institucional.
   * Guarda en `user` los datos + el accessToken (que el backend
   * recibe como googleIdToken para validar con Auth0 JWKS).
   */
  const fetchUserInfo = useCallback(
    async (accessToken, idToken) => {
      const responseUser = await fetch(`https://${auth0Domain}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const profile = await responseUser.json();

      if (!profile.email?.endsWith(`@${allowedDomain}`)) {
        setError(`Acceso denegado. Solo se permiten cuentas @${allowedDomain}`);
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
        domain: profile.email?.split('@')[1],
        lastLogin: new Date().toISOString(),
        idToken: idToken,
      });
    },
    [allowedDomain, auth0Domain],
  );

  /**
   * Intercambia el authorization code (PKCE) por tokens de Auth0.
   * Devuelve el access_token (JWT RS256 validable en el backend).
   */
  const exchangeCodeForToken = useCallback(
    async (code, codeVerifier) => {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: auth0ClientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      });

      if (auth0Audience) {
        params.append('audience', auth0Audience);
      }

      const tokenRes = await fetch(`https://${auth0Domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const tokenJson = await tokenRes.json();

      if (!tokenRes.ok || !tokenJson.access_token) {
        throw new Error(
          tokenJson.error_description ||
            tokenJson.error ||
            'No se pudo obtener access token de Auth0',
        );
      }

      return {
        accessToken: tokenJson.access_token,
        idToken: tokenJson.id_token
      };
    },
    [auth0Audience, auth0ClientId, auth0Domain, redirectUri],
  );

  const signIn = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      if (!auth0Domain || !auth0ClientId) {
        setError(
          'Falta configurar Auth0: EXPO_PUBLIC_AUTH0_DOMAIN y EXPO_PUBLIC_AUTH0_CLIENT_ID en .env',
        );
        return;
      }

      if (!request || !discovery) {
        setError(
          'La solicitud de autenticación aún no está lista. Intenta de nuevo.',
        );
        return;
      }

      if (isExpoGo && !projectFullName) {
        setError('En Expo Go falta owner/slug para AuthSession proxy.');
        return;
      }

      console.log('[Auth0] redirectUri:', redirectUri);
      const result = await promptAsync();

      if (result.type !== 'success') {
        const authError =
          result.params?.error_description ||
          result.params?.error ||
          result.error?.message;

        if (result.type === 'cancel') {
          setError('Inicio de sesión cancelado');
        } else if (result.type === 'dismiss') {
          setError(
            'Se cerró la pantalla de inicio de sesión antes de completar el proceso.',
          );
        } else {
          setError(authError || 'No se pudo completar el inicio de sesión');
        }
        return;
      }

      const code = result.params?.code;

      if (!code || !request.codeVerifier) {
        setError('Auth0 no devolvió código de autorización válido.');
        return;
      }

      const tokens = await exchangeCodeForToken(code, request.codeVerifier);
      await fetchUserInfo(tokens.accessToken, tokens.idToken);
    } catch (err) {
      console.error('[Auth0] Sign-In error:', err);
      setError(err.message || 'Error al iniciar sesión con Auth0');
    } finally {
      setLoading(false);
    }
  }, [
    projectFullName,
    auth0ClientId,
    auth0Domain,
    discovery,
    exchangeCodeForToken,
    fetchUserInfo,
    isExpoGo,
    promptAsync,
    redirectUri,
    request,
  ]);

  const signOut = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    error,
    loading,
    request,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
}
