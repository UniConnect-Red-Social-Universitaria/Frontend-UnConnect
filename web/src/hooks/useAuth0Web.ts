/**
 * useAuth0Web
 *
 * Implementa el flujo Auth0 Authorization Code + PKCE para navegador
 * sin depender de @auth0/auth0-react (que no es compatible con React 19).
 *
 * Uso:
 *   const { initiateLogin, handleCallback, loading, error } = useAuth0Web();
 *
 * Flujo:
 *   1. Llama initiateLogin() → redirige al usuario a Auth0.
 *   2. Auth0 redirige de vuelta a /completar-registro?code=...
 *   3. Llama handleCallback() con el code y codeVerifier guardados en sessionStorage.
 *   4. Devuelve { accessToken, profile } para usarse en el registro.
 */

import { useState, useCallback } from 'react';

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN as string;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
const AUTH0_CONNECTION = (import.meta.env.VITE_AUTH0_CONNECTION as string) || 'google-oauth2';
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined;
const ALLOWED_DOMAIN = (import.meta.env.VITE_ALLOWED_DOMAIN as string) || 'ucaldas.edu.co';

const REDIRECT_URI = `${window.location.origin}/completar-registro`;

const SESSION_KEY_VERIFIER = 'auth0_pkce_verifier';
const SESSION_KEY_STATE = 'auth0_pkce_state';


export interface Auth0Profile {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email: string;
  picture?: string;
}

export interface Auth0CallbackResult {
  accessToken: string; 
  idToken: string;      
  profile: Auth0Profile;
}

export function useAuth0Web() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genera el state y code_verifier, los guarda en sessionStorage y
   * redirige al usuario al endpoint de Auth0 /authorize.
   */
  const initiateLogin = useCallback(async () => {
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
      setError('Falta configurar VITE_AUTH0_DOMAIN y VITE_AUTH0_CLIENT_ID en .env');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const verifier = await generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const state = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer);

      sessionStorage.setItem(SESSION_KEY_VERIFIER, verifier);
      sessionStorage.setItem(SESSION_KEY_STATE, state);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: AUTH0_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: 'openid profile email',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        connection: AUTH0_CONNECTION,
        prompt: 'login',
      });

      if (AUTH0_AUDIENCE) {
        params.set('audience', AUTH0_AUDIENCE);
      }

      window.location.href = `https://${AUTH0_DOMAIN}/authorize?${params.toString()}`;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar autenticación con Auth0');
      setLoading(false);
    }
  }, []);

  /**
   * Procesa el callback de Auth0 (debe llamarse en la página /completar-registro
   * cuando la URL contiene ?code=...).
   * Intercambia el code por un access_token y obtiene el perfil del usuario.
   */
  const handleCallback = useCallback(
    async (code: string, returnedState: string): Promise<Auth0CallbackResult | null> => {
      setError(null);
      setLoading(true);

      try {
        const verifier = sessionStorage.getItem(SESSION_KEY_VERIFIER);
        const savedState = sessionStorage.getItem(SESSION_KEY_STATE);

        sessionStorage.removeItem(SESSION_KEY_VERIFIER);
        sessionStorage.removeItem(SESSION_KEY_STATE);

        if (!verifier || !savedState) {
          setError('No se encontró el código PKCE guardado. Inicia el proceso desde el principio.');
          return null;
        }

        if (returnedState !== savedState) {
          setError('Estado de seguridad inválido. Posible ataque CSRF.');
          return null;
        }

        const tokenParams = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: AUTH0_CLIENT_ID,
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier,
        });

        if (AUTH0_AUDIENCE) {
          tokenParams.append('audience', AUTH0_AUDIENCE);
        }

        const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenParams.toString(),
        });

        const tokenJson = await tokenRes.json();

        if (!tokenRes.ok || !tokenJson.access_token) {
          throw new Error(
            tokenJson.error_description ||
              tokenJson.error ||
              'No se pudo obtener el access token de Auth0',
          );
        }

        const accessToken: string = tokenJson.access_token;
        const idToken: string = tokenJson.id_token;

        if (!idToken) {
          throw new Error(
            'Auth0 no devolvió id_token. Asegúrate de incluir el scope "openid" y que la conexión lo soporte.',
          );
        }

        const profileRes = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const profile: Auth0Profile = await profileRes.json();

        if (!profile.email?.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
          setError(`Acceso denegado. Solo se permiten cuentas @${ALLOWED_DOMAIN}`);
          return null;
        }

        return { accessToken, idToken, profile };
      } catch (err: any) {
        setError(err.message || 'Error al procesar la autenticación con Auth0');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { initiateLogin, handleCallback, loading, error, setError };
}
