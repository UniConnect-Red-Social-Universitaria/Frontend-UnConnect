/**
 * Mensajes service para web — usa localStorage en vez de AsyncStorage
 */
import { resolverApiBaseUrl } from '../utils/apiConfig';

const API_URL = `${resolverApiBaseUrl()}/api`;

const getToken = (): string | null => localStorage.getItem('userToken');

export const obtenerHistorialMensajes = async (contactoId: string) => {
	const token = getToken();
	if (!token) throw new Error('No se encontró el token.');

	const res = await fetch(`${API_URL}/mensajes/${contactoId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.json();
};

export const enviarNuevoMensaje = async (contactoId: string, contenido: string) => {
	const token = getToken();
	if (!token) throw new Error('No autenticado.');

	const res = await fetch(`${API_URL}/mensajes`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ receptorId: contactoId, contenido }),
	});
	return res.json();
};

export const obtenerHistorialMensajesGrupo = async (grupoId: string) => {
	const token = getToken();
	if (!token) throw new Error('No se encontró el token.');

	const res = await fetch(`${API_URL}/mensajes/grupos/${grupoId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.json();
};

export const enviarNuevoMensajeGrupo = async (grupoId: string, contenido: string) => {
	const token = getToken();
	if (!token) throw new Error('No autenticado.');

	const res = await fetch(`${API_URL}/grupos/${grupoId}/mensajes`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ contenido }),
	});
	return res.json();
};

export const agregarReaccion = async (mensajeId: string, emoji: string, esGrupo: boolean = true) => {
	const token = getToken();
	if (!token) throw new Error('No autenticado.');

	const res = await fetch(`${API_URL}/mensajes/${mensajeId}/reacciones`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ emoji, esGrupo }),
	});
	return res.json();
};

export const removerReaccion = async (mensajeId: string, emoji: string, esGrupo: boolean = true) => {
	const token = getToken();
	if (!token) throw new Error('No autenticado.');

	const res = await fetch(`${API_URL}/mensajes/${mensajeId}/reacciones`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ emoji, esGrupo }),
	});
	return res.json();
};
