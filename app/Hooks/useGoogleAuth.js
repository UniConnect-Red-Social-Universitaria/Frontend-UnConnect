import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
	const [user, setUser] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const allowedDomain = process.env.EXPO_PUBLIC_ALLOWED_DOMAIN || 'ucaldas.edu.co';
	const googleClientIdWeb = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
	const googleClientIdExpo =
		process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_EXPO || googleClientIdWeb;
	const googleClientIdAndroid = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID;
	const googleClientIdIos = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;
	const googleClientId = useMemo(() => {
		if (Platform.OS === 'web') {
			return googleClientIdWeb;
		}

		const isExpoGo =
			Constants.executionEnvironment === 'storeClient' ||
			Constants.appOwnership === 'expo' ||
			Constants.appOwnership === 'guest';

		if (isExpoGo) {
			return googleClientIdExpo;
		}

		if (Platform.OS === 'ios') {
			return googleClientIdIos || googleClientIdExpo || googleClientIdWeb;
		}

		if (Platform.OS === 'android') {
			return googleClientIdAndroid || googleClientIdExpo || googleClientIdWeb;
		}

		return googleClientIdExpo || googleClientIdWeb;
	}, [googleClientIdAndroid, googleClientIdExpo, googleClientIdIos, googleClientIdWeb]);

	const redirectUri = useMemo(() => {
		if (Platform.OS === 'web') {
			return window.location.origin;
		}

		const isExpoGo =
			Constants.executionEnvironment === 'storeClient' ||
			Constants.appOwnership === 'expo' ||
			Constants.appOwnership === 'guest';

		if (isExpoGo) {
			const appOwner = Constants.expoConfig?.owner || 'jackeliner';
			const appSlug = Constants.expoConfig?.slug || 'uniconnect-app';
			return AuthSession.makeRedirectUri({
				useProxy: true,
				projectNameForProxy: `@${appOwner}/${appSlug}`,
			});
		}

		return AuthSession.makeRedirectUri({
			scheme: 'com.jackeliner.uniconnectapp',
			path: 'google-callback',
		});
	}, []);

	const discovery = useMemo(() => {
		return {
			authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
			tokenEndpoint: 'https://oauth2.googleapis.com/token',
			revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
			userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
		};
	}, []);

	const [request, response, promptAsync] = AuthSession.useAuthRequest(
		{
			clientId: googleClientId,
			redirectUri,
			responseType: AuthSession.ResponseType.Code,
			usePKCE: true,
			scopes: ['openid', 'profile', 'email'],
			extraParams: {
				prompt: 'select_account',
			},
		},
		discovery
	);

	const fetchUserInfo = useCallback(
		async (accessToken, idToken) => {
			try {
				const responseUser = await fetch(
					'https://openidconnect.googleapis.com/v1/userinfo',
					{
						headers: { Authorization: `Bearer ${accessToken}` },
					}
				);

				if (!responseUser.ok) {
					throw new Error('No se pudo obtener el perfil del usuario de Google.');
				}

				const profile = await responseUser.json();
				const email = String(profile.email || '')
					.trim()
					.toLowerCase();

				if (!email || !email.endsWith(`@${allowedDomain}`)) {
					setError(`Acceso denegado. Solo se permiten cuentas @${allowedDomain}`);
					setUser(null);
					return;
				}

				if (!idToken) {
					setError(
						'No se pudo obtener el token de identidad de Google. Intenta nuevamente.'
					);
					setUser(null);
					return;
				}

				setUser({
					id: profile.sub,
					name: profile.name,
					given_name: profile.given_name,
					family_name: profile.family_name,
					email,
					picture: profile.picture,
					idToken: idToken,
				});
			} catch (err) {
				throw new Error('Error al obtener el perfil del usuario.');
			}
		},
		[allowedDomain]
	);

	const exchangeCodeForToken = useCallback(
		async (code, codeVerifier) => {
			const params = new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: googleClientId,
				code,
				redirect_uri: redirectUri,
				code_verifier: codeVerifier,
			});

			const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: params.toString(),
			});

			const tokenJson = await tokenRes.json();

			if (!tokenRes.ok || !tokenJson.access_token) {
				throw new Error(
					tokenJson.error_description || tokenJson.error || 'No se pudo obtener el token.'
				);
			}

			return {
				accessToken: tokenJson.access_token,
				idToken: tokenJson.id_token,
			};
		},
		[googleClientId, redirectUri]
	);

	useEffect(() => {
		const handleResponse = async () => {
			if (response?.type === 'success') {
				setLoading(true);
				setError(null);
				try {
					const code = response.params?.code;
					if (!code || !request?.codeVerifier) {
						setError('Google no devolvió un código válido.');
						return;
					}

					const tokens = await exchangeCodeForToken(code, request.codeVerifier);
					await fetchUserInfo(tokens.accessToken, tokens.idToken);
				} catch (err) {
					setError(err.message || 'Error al procesar el inicio de sesión.');
				} finally {
					setLoading(false);
				}
			} else if (response?.type === 'error') {
				setError(response.params?.error_description || 'Error en la autenticación.');
			} else if (response?.type === 'dismiss' || response?.type === 'cancel') {
				setError('Inicio de sesión cancelado.');
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
			if (!googleClientId) {
				setError('Falta configurar los client IDs de Google en .env');
				setLoading(false);
				return;
			}

			if (!request) {
				setError('La solicitud aún no está lista. Intenta de nuevo.');
				setLoading(false);
				return;
			}

			await promptAsync();
		} catch (err) {
			console.error('Sign-In error:', err);
			setError(err.message || 'Error inesperado.');
			setLoading(false);
		}
	}, [googleClientId, promptAsync, request, redirectUri]);

	const signOut = useCallback(() => {
		setUser(null);
		setError(null);
	}, []);

	return { user, error, loading, request, signIn, signOut };
}
