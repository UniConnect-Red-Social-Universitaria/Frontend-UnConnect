/**
 * Badge de notificaciones no leídas — versión web con localStorage
 * La misma API pública que la versión RN para que los hooks sean intercambiables.
 */

const UNREAD_KEY = 'unreadNotificationsCount';

type Listener = (count: number) => void;

let unreadCount = 0;
let loaded = false;
const listeners = new Set<Listener>();

function ensureLoaded() {
	if (loaded) return;

	try {
		const raw = localStorage.getItem(UNREAD_KEY);
		const parsed = raw ? Number(raw) : 0;
		unreadCount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
	} catch {
		unreadCount = 0;
	} finally {
		loaded = true;
	}
}

function persistAndNotify() {
	try {
		localStorage.setItem(UNREAD_KEY, String(unreadCount));
	} catch {
		// seguir con valor en memoria si falla
	}

	listeners.forEach((listener) => listener(unreadCount));
}

export async function getUnreadNotificationsCount(): Promise<number> {
	ensureLoaded();
	return unreadCount;
}

export async function incrementUnreadNotificationsCount(step: number = 1): Promise<void> {
	ensureLoaded();
	unreadCount += Math.max(1, Math.floor(step));
	persistAndNotify();
}

export async function clearUnreadNotificationsCount(): Promise<void> {
	ensureLoaded();
	unreadCount = 0;
	persistAndNotify();
}

export function subscribeUnreadNotificationsCount(listener: Listener): () => void {
	listeners.add(listener);

	void getUnreadNotificationsCount().then((count) => {
		if (listeners.has(listener)) {
			listener(count);
		}
	});

	return () => {
		listeners.delete(listener);
	};
}
