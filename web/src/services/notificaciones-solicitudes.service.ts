const UNREAD_CONTACT_REQUESTS_KEY = 'unreadContactRequestNotifications';

export type UnreadContactRequestNotification = {
	solicitudId: string;
	solicitanteId: string;
	nombre: string;
	createdAt: string;
};

type Listener = (items: UnreadContactRequestNotification[]) => void;

let loaded = false;
let unreadRequests: UnreadContactRequestNotification[] = [];
const listeners = new Set<Listener>();

function sortByDateDesc<T extends { createdAt: string }>(items: T[]): T[] {
	return [...items].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);
}

function ensureLoaded() {
	if (loaded) return;
	try {
		const raw = localStorage.getItem(UNREAD_CONTACT_REQUESTS_KEY);
		unreadRequests = sortByDateDesc(raw ? JSON.parse(raw) : []);
	} catch {
		unreadRequests = [];
	} finally {
		loaded = true;
	}
}

function persistAndNotify() {
	try {
		localStorage.setItem(UNREAD_CONTACT_REQUESTS_KEY, JSON.stringify(unreadRequests));
	} catch {}
	const snapshot = sortByDateDesc(unreadRequests);
	listeners.forEach((l) => l(snapshot));
}

export async function getUnreadContactRequestNotifications(): Promise<UnreadContactRequestNotification[]> {
	ensureLoaded();
	return sortByDateDesc(unreadRequests);
}

export async function upsertUnreadContactRequestNotification(params: {
	solicitudId: string;
	solicitanteId?: string;
	nombre?: string;
}): Promise<void> {
	ensureLoaded();
	const solicitudId = String(params.solicitudId ?? '').trim();
	if (!solicitudId) return;

	const nextItem: UnreadContactRequestNotification = {
		solicitudId,
		solicitanteId: typeof params.solicitanteId === 'string' ? params.solicitanteId : '',
		nombre: typeof params.nombre === 'string' && params.nombre.trim() ? params.nombre.trim() : 'Usuario',
		createdAt: new Date().toISOString(),
	};

	const idx = unreadRequests.findIndex((i) => i.solicitudId === solicitudId);
	if (idx >= 0) {
		unreadRequests[idx] = nextItem;
	} else {
		unreadRequests.push(nextItem);
	}

	unreadRequests = sortByDateDesc(unreadRequests);
	persistAndNotify();
}

export async function clearUnreadContactRequestNotification(solicitudId: string): Promise<void> {
	ensureLoaded();
	const removed = unreadRequests.filter((i) => i.solicitudId === solicitudId.trim()).length;
	unreadRequests = unreadRequests.filter((i) => i.solicitudId !== solicitudId.trim());
	persistAndNotify();
	if (removed > 0) {
		const { decrementUnreadNotificationsCount } = await import('./notificaciones-badge.service');
		await decrementUnreadNotificationsCount(removed);
	}
}

export function subscribeUnreadContactRequestNotifications(listener: Listener): () => void {
	listeners.add(listener);
	void getUnreadContactRequestNotifications().then((items) => {
		if (listeners.has(listener)) listener(items);
	});
	return () => listeners.delete(listener);
}
