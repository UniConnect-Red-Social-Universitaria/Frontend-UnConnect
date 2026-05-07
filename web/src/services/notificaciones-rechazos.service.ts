const UNREAD_REJECTED_REQUESTS_KEY = 'unreadRejectedRequestNotifications';

export type UnreadRejectedRequestNotification = {
	solicitudId: string;
	solicitanteId: string;
	receptorId: string;
	receptorNombre: string;
	tipo: 'contacto';
	updatedAt: string;
};

type Listener = (items: UnreadRejectedRequestNotification[]) => void;

let loaded = false;
let unreadRejectedRequests: UnreadRejectedRequestNotification[] = [];
const listeners = new Set<Listener>();

function sortByDateDesc<T extends { updatedAt: string }>(items: T[]): T[] {
	return [...items].sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
	);
}

function ensureLoaded() {
	if (loaded) return;
	try {
		const raw = localStorage.getItem(UNREAD_REJECTED_REQUESTS_KEY);
		unreadRejectedRequests = sortByDateDesc(raw ? JSON.parse(raw) : []);
	} catch {
		unreadRejectedRequests = [];
	} finally {
		loaded = true;
	}
}

function persistAndNotify() {
	try {
		localStorage.setItem(UNREAD_REJECTED_REQUESTS_KEY, JSON.stringify(unreadRejectedRequests));
	} catch {}
	const snapshot = sortByDateDesc(unreadRejectedRequests);
	listeners.forEach((l) => l(snapshot));
}

export async function getUnreadRejectedRequestNotifications(): Promise<UnreadRejectedRequestNotification[]> {
	ensureLoaded();
	return sortByDateDesc(unreadRejectedRequests);
}

export async function upsertUnreadRejectedRequestNotification(params: {
	solicitudId: string;
	solicitanteId?: string;
	receptorId?: string;
	receptorNombre?: string;
	tipo?: 'contacto';
	updatedAt?: string;
}): Promise<void> {
	ensureLoaded();
	const solicitudId = String(params.solicitudId ?? '').trim();
	if (!solicitudId) return;

	const nextItem: UnreadRejectedRequestNotification = {
		solicitudId,
		solicitanteId: typeof params.solicitanteId === 'string' ? params.solicitanteId : '',
		receptorId: typeof params.receptorId === 'string' ? params.receptorId : '',
		receptorNombre: typeof params.receptorNombre === 'string' && params.receptorNombre.trim() ? params.receptorNombre.trim() : 'usuario',
		tipo: 'contacto',
		updatedAt: typeof params.updatedAt === 'string' ? params.updatedAt : new Date().toISOString(),
	};

	const idx = unreadRejectedRequests.findIndex((i) => i.solicitudId === solicitudId);
	if (idx >= 0) {
		unreadRejectedRequests[idx] = nextItem;
	} else {
		unreadRejectedRequests.push(nextItem);
	}

	unreadRejectedRequests = sortByDateDesc(unreadRejectedRequests);
	persistAndNotify();
}

export async function clearUnreadRejectedRequestNotification(solicitudId: string): Promise<void> {
	ensureLoaded();
	unreadRejectedRequests = unreadRejectedRequests.filter((i) => i.solicitudId !== solicitudId.trim());
	persistAndNotify();
}

export function subscribeUnreadRejectedRequestNotifications(listener: Listener): () => void {
	listeners.add(listener);
	void getUnreadRejectedRequestNotifications().then((items) => {
		if (listeners.has(listener)) listener(items);
	});
	return () => listeners.delete(listener);
}
