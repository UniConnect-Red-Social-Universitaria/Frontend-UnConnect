const TOKEN_KEY = 'userToken';
const USER_ID_KEY = 'userId';

/**
 * @typedef {{ getItem(key: string): Promise<string|null>, setItem(key: string, value: string): Promise<void>, removeItem(key: string): Promise<void> }} AsyncKeyValueStorage
 */

function normalizeBaseUrl(baseUrl) {
	return String(baseUrl || '').replace(/\/+$/, '');
}

function isProbablyNetworkError(err) {
	const message =
		err && typeof err === 'object' && 'message' in err
			? String(err.message)
			: String(err);
	return (
		message.includes('Network request failed') || message.includes('Failed to fetch')
	);
}

/**
 * Crea un cliente HTTP reutilizable para app (Expo/RN) y web (Vite).
 * No depende de React Native; se le inyecta baseUrl + storage.
 */
export function createApiClient({ baseUrl, storage }) {
	const baseUrlNorm = normalizeBaseUrl(baseUrl);

	if (!baseUrlNorm) {
		throw new Error('ApiClient requiere baseUrl');
	}
	if (!storage) {
		throw new Error('ApiClient requiere storage');
	}

	async function getToken() {
		return storage.getItem(TOKEN_KEY);
	}

	async function setToken(token) {
		await storage.setItem(TOKEN_KEY, token);
	}

	async function removeToken() {
		await storage.removeItem(TOKEN_KEY);
	}

	async function getUserId() {
		return storage.getItem(USER_ID_KEY);
	}

	async function setUserId(userId) {
		await storage.setItem(USER_ID_KEY, userId);
	}

	function getBaseUrl() {
		return baseUrlNorm;
	}

	async function request(endpoint, options = {}) {
		const url = `${baseUrlNorm}${endpoint}`;
		const token = await getToken();

		const headers = {
			...(options.headers || {}),
		};

		if (options.body || ['POST', 'PUT', 'PATCH'].includes(options.method || '')) {
			headers['Content-Type'] = headers['Content-Type'] || 'application/json';
			if (!options.body) {
				options.body = '{}';
			}
		}

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		try {
			const response = await fetch(url, {
				...options,
				headers,
			});

			const contentType = response.headers.get('content-type') || '';
			const rawBody = await response.text();

			if (!contentType.includes('application/json')) {
				if (!response.ok) {
					throw new Error('Error del servidor. Inténtalo de nuevo más tarde.');
				}
				throw new Error('Respuesta inesperada del servidor.');
			}

			const data = rawBody ? JSON.parse(rawBody) : {};

			if (!response.ok) {
				throw new Error(data.message || 'Error en la solicitud al servidor.');
			}

			return data;
		} catch (error) {
			console.error(`[API ${options.method || 'GET'} ${endpoint}]`, error);

			if (isProbablyNetworkError(error)) {
				throw new Error('Error de conexión con el servidor. Revisa tu internet.');
			}

			if (error instanceof Error) {
				throw error;
			}

			throw new Error('Error de conexión con el servidor.');
		}
	}

	async function publicRequest(endpoint, options = {}) {
		const url = `${baseUrlNorm}${endpoint}`;

		const headers = {
			...(options.headers || {}),
		};

		if (options.body || ['POST', 'PUT', 'PATCH'].includes(options.method || '')) {
			headers['Content-Type'] = headers['Content-Type'] || 'application/json';
			if (!options.body) {
				options.body = '{}';
			}
		}

		try {
			const response = await fetch(url, {
				...options,
				headers,
			});

			const contentType = response.headers.get('content-type') || '';
			const rawBody = await response.text();

			if (!contentType.includes('application/json')) {
				if (!response.ok) {
					throw new Error('Error del servidor. Inténtalo de nuevo más tarde.');
				}
				throw new Error('Respuesta inesperada del servidor.');
			}

			const data = rawBody ? JSON.parse(rawBody) : {};

			if (!response.ok) {
				throw new Error(data.message || 'Error en la solicitud al servidor.');
			}

			return data;
		} catch (error) {
			console.error(`[API PUBLIC ${options.method || 'GET'} ${endpoint}]`, error);

			if (isProbablyNetworkError(error)) {
				throw new Error('Error de conexión con el servidor. Revisa tu internet.');
			}

			if (error instanceof Error) {
				throw error;
			}

			throw new Error('Error de conexión con el servidor.');
		}
	}

	return {
		getBaseUrl,
		getToken,
		setToken,
		removeToken,
		getUserId,
		setUserId,

		request,
		publicRequest,

		get: (endpoint) => request(endpoint, { method: 'GET' }),
		post: (endpoint, body) =>
			request(endpoint, {
				method: 'POST',
				body: body ? JSON.stringify(body) : undefined,
			}),
		put: (endpoint, body) =>
			request(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
		patch: (endpoint, body) =>
			request(endpoint, {
				method: 'PATCH',
				body: body ? JSON.stringify(body) : undefined,
			}),
		delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
	};
}
