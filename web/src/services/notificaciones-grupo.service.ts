const UNREAD_GROUP_NOTIFICATIONS_KEY = 'unreadGroupEventNotifications';

export type GroupNotificationType =
	| 'solicitud-ingreso'
	| 'solicitud-aprobada'
	| 'solicitud-rechazada'
	| 'admin-transferido'
	| 'evento-nuevo'
	| 'notificacion-general';

export type UnreadGroupEventNotification = {
	id: string;
	tipo: GroupNotificationType;
	grupoId: string;
	grupoNombre: string;
	mensaje: string;
	createdAt: string;
};

type Listener = (items: UnreadGroupEventNotification[]) => void;

let loaded = false;
let unreadItems: UnreadGroupEventNotification[] = [];
const listeners = new Set<Listener>();

function sortByDateDesc<T extends { createdAt: string }>(items: T[]): T[] {
	return [...items].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);
}

function ensureLoaded() {
	if (loaded) return;
	try {
		const raw = localStorage.getItem(UNREAD_GROUP_NOTIFICATIONS_KEY);
		unreadItems = sortByDateDesc(raw ? JSON.parse(raw) : []);
	} catch {
		unreadItems = [];
	} finally {
		loaded = true;
	}
}

function persistAndNotify() {
	try {
		localStorage.setItem(UNREAD_GROUP_NOTIFICATIONS_KEY, JSON.stringify(unreadItems));
	} catch {}
	const snapshot = sortByDateDesc(unreadItems);
	listeners.forEach((l) => l(snapshot));
}

export async function getUnreadGroupEventNotifications(): Promise<UnreadGroupEventNotification[]> {
	ensureLoaded();
	return sortByDateDesc(unreadItems);
}

export async function upsertUnreadGroupEventNotification(
	params: UnreadGroupEventNotification
): Promise<void> {
	ensureLoaded();
	const idx = unreadItems.findIndex((i) => i.id === params.id);
	if (idx >= 0) {
		unreadItems[idx] = params;
	} else {
		unreadItems.push(params);
	}
	unreadItems = sortByDateDesc(unreadItems);
	persistAndNotify();
}

export async function clearUnreadGroupEventNotification(notificationId: string): Promise<void> {
	ensureLoaded();
	unreadItems = unreadItems.filter((i) => i.id !== notificationId);
	persistAndNotify();
}

export async function clearAllUnreadGroupEventNotifications(): Promise<void> {
	ensureLoaded();
	unreadItems = [];
	persistAndNotify();
}

export function subscribeUnreadGroupEventNotifications(listener: Listener): () => void {
	listeners.add(listener);
	void getUnreadGroupEventNotifications().then((items) => {
		if (listeners.has(listener)) listener(items);
	});
	return () => listeners.delete(listener);
}
