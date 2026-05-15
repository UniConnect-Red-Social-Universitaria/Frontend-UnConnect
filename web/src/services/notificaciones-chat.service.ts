/**
 * Notificaciones de chat directo y grupal — versión web con localStorage
 */

const UNREAD_DIRECT_CHATS_KEY = 'unreadDirectChatNotifications';
const UNREAD_GROUP_CHATS_KEY = 'unreadGroupChatNotifications';

export type UnreadDirectChatNotification = {
	contactoId: string;
	nombre: string;
	ultimoMensaje: string;
	updatedAt: string;
	mensajesNoLeidos: number;
};

export type UnreadGroupChatNotification = {
	grupoId: string;
	nombreGrupo: string;
	ultimoMensaje: string;
	updatedAt: string;
	mensajesNoLeidos: number;
};

type Listener = (items: UnreadDirectChatNotification[]) => void;
type GroupListener = (items: UnreadGroupChatNotification[]) => void;

let loaded = false;
let unreadDirectChats: UnreadDirectChatNotification[] = [];
const listeners = new Set<Listener>();
let groupsLoaded = false;
let unreadGroupChats: UnreadGroupChatNotification[] = [];
const groupListeners = new Set<GroupListener>();

function sortByDateDesc<T extends { updatedAt: string }>(items: T[]): T[] {
	return [...items].sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
	);
}

function ensureLoaded() {
	if (loaded) return;
	try {
		const raw = localStorage.getItem(UNREAD_DIRECT_CHATS_KEY);
		unreadDirectChats = sortByDateDesc(raw ? JSON.parse(raw) : []);
	} catch {
		unreadDirectChats = [];
	} finally {
		loaded = true;
	}
}

function ensureGroupsLoaded() {
	if (groupsLoaded) return;
	try {
		const raw = localStorage.getItem(UNREAD_GROUP_CHATS_KEY);
		unreadGroupChats = sortByDateDesc(raw ? JSON.parse(raw) : []);
	} catch {
		unreadGroupChats = [];
	} finally {
		groupsLoaded = true;
	}
}

function persistAndNotify() {
	try {
		localStorage.setItem(UNREAD_DIRECT_CHATS_KEY, JSON.stringify(unreadDirectChats));
	} catch {}
	const snapshot = sortByDateDesc(unreadDirectChats);
	listeners.forEach((l) => l(snapshot));
}

function persistGroupsAndNotify() {
	try {
		localStorage.setItem(UNREAD_GROUP_CHATS_KEY, JSON.stringify(unreadGroupChats));
	} catch {}
	const snapshot = sortByDateDesc(unreadGroupChats);
	groupListeners.forEach((l) => l(snapshot));
}

export async function getUnreadDirectChatNotifications(): Promise<UnreadDirectChatNotification[]> {
	ensureLoaded();
	return sortByDateDesc(unreadDirectChats);
}

export async function upsertUnreadDirectChatNotification(params: {
	contactoId: string;
	nombre?: string;
	mensaje?: string;
}): Promise<void> {
	ensureLoaded();
	const contactoId = String(params.contactoId ?? '').trim();
	if (!contactoId) return;

	const nombre = typeof params.nombre === 'string' && params.nombre.trim() ? params.nombre.trim() : 'Usuario';
	const mensaje = typeof params.mensaje === 'string' ? params.mensaje.trim() : '';

	const idx = unreadDirectChats.findIndex((i) => i.contactoId === contactoId);
	if (idx >= 0) {
		const ex = unreadDirectChats[idx];
		unreadDirectChats[idx] = {
			...ex,
			nombre: nombre || ex.nombre,
			ultimoMensaje: mensaje || ex.ultimoMensaje,
			updatedAt: new Date().toISOString(),
			mensajesNoLeidos: ex.mensajesNoLeidos + 1,
		};
	} else {
		unreadDirectChats.push({ contactoId, nombre, ultimoMensaje: mensaje, updatedAt: new Date().toISOString(), mensajesNoLeidos: 1 });
	}

	unreadDirectChats = sortByDateDesc(unreadDirectChats);
	persistAndNotify();
}

export async function clearUnreadDirectChatNotification(contactoId: string): Promise<void> {
	ensureLoaded();
	unreadDirectChats = unreadDirectChats.filter((i) => i.contactoId !== contactoId.trim());
	persistAndNotify();
}

export function subscribeUnreadDirectChatNotifications(listener: Listener): () => void {
	listeners.add(listener);
	void getUnreadDirectChatNotifications().then((items) => {
		if (listeners.has(listener)) listener(items);
	});
	return () => listeners.delete(listener);
}

export async function getUnreadGroupChatNotifications(): Promise<UnreadGroupChatNotification[]> {
	ensureGroupsLoaded();
	return sortByDateDesc(unreadGroupChats);
}

export async function upsertUnreadGroupChatNotification(params: {
	grupoId: string;
	nombreGrupo?: string;
	mensaje?: string;
}): Promise<void> {
	ensureGroupsLoaded();
	const grupoId = String(params.grupoId ?? '').trim();
	if (!grupoId) return;

	const nombreGrupo = typeof params.nombreGrupo === 'string' && params.nombreGrupo.trim() ? params.nombreGrupo.trim() : 'Grupo';
	const mensaje = typeof params.mensaje === 'string' ? params.mensaje.trim() : '';

	const idx = unreadGroupChats.findIndex((i) => i.grupoId === grupoId);
	if (idx >= 0) {
		const ex = unreadGroupChats[idx];
		unreadGroupChats[idx] = {
			...ex,
			nombreGrupo: nombreGrupo || ex.nombreGrupo,
			ultimoMensaje: mensaje || ex.ultimoMensaje,
			updatedAt: new Date().toISOString(),
			mensajesNoLeidos: ex.mensajesNoLeidos + 1,
		};
	} else {
		unreadGroupChats.push({ grupoId, nombreGrupo, ultimoMensaje: mensaje, updatedAt: new Date().toISOString(), mensajesNoLeidos: 1 });
	}

	unreadGroupChats = sortByDateDesc(unreadGroupChats);
	persistGroupsAndNotify();
}

export async function clearUnreadGroupChatNotification(grupoId: string): Promise<void> {
	ensureGroupsLoaded();
	unreadGroupChats = unreadGroupChats.filter((i) => i.grupoId !== grupoId.trim());
	persistGroupsAndNotify();
}

export function subscribeUnreadGroupChatNotifications(listener: GroupListener): () => void {
	groupListeners.add(listener);
	void getUnreadGroupChatNotifications().then((items) => {
		if (groupListeners.has(listener)) listener(items);
	});
	return () => groupListeners.delete(listener);
}
