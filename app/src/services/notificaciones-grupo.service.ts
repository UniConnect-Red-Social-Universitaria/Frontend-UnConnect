import AsyncStorage from '@react-native-async-storage/async-storage';

const UNREAD_GROUP_NOTIFICATIONS_KEY = 'unreadGroupEventNotifications';

export type GroupNotificationType =
	| 'solicitud-ingreso'        // Admin recibe: alguien solicitó entrar
	| 'solicitud-invitacion'     // Estudiante recibe: fue invitado a un grupo
	| 'solicitud-aprobada'       // Solicitante recibe: aprobaron su solicitud
	| 'solicitud-rechazada'      // Solicitante recibe: rechazaron su solicitud
	| 'transferencia-pendiente'  // Candidato recibe: le ofrecen transferir la admin
	| 'transferencia-aceptada'   // Admin/candidato recibe: la transferencia se aceptó
	| 'transferencia-rechazada'  // Admin/candidato recibe: la transferencia se rechazó
	| 'transferencia-cancelada'  // Admin/candidato recibe: la transferencia se canceló
	| 'admin-transferido'        // Nuevo/anterior admin: se transfirió el rol
	| 'evento-nuevo'
	| 'notificacion-general';

export type UnreadGroupEventNotification = {
	id: string; // unique key
	tipo: GroupNotificationType;
	solicitudId?: string;
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
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}

async function ensureLoaded() {
	if (loaded) {
		return;
	}

	try {
		const raw = await AsyncStorage.getItem(UNREAD_GROUP_NOTIFICATIONS_KEY);
		unreadItems = sortByDateDesc(raw ? JSON.parse(raw) : []);
	} catch {
		unreadItems = [];
	} finally {
		loaded = true;
	}
}

async function persistAndNotify() {
	try {
		await AsyncStorage.setItem(
			UNREAD_GROUP_NOTIFICATIONS_KEY,
			JSON.stringify(unreadItems),
		);
	} catch {
		// Keep in-memory data if persistence fails.
	}

	const snapshot = sortByDateDesc(unreadItems);
	listeners.forEach((listener) => listener(snapshot));
}

export async function getUnreadGroupEventNotifications(): Promise<
	UnreadGroupEventNotification[]
> {
	await ensureLoaded();
	return sortByDateDesc(unreadItems);
}

export async function upsertUnreadGroupEventNotification(
	params: UnreadGroupEventNotification,
): Promise<void> {
	await ensureLoaded();

	const existingIndex = unreadItems.findIndex((item) => item.id === params.id);

	if (existingIndex >= 0) {
		unreadItems[existingIndex] = params;
	} else {
		unreadItems.push(params);
	}

	unreadItems = sortByDateDesc(unreadItems);
	await persistAndNotify();
}

export async function clearUnreadGroupEventNotification(
	notificationId: string,
): Promise<void> {
	await ensureLoaded();

	unreadItems = unreadItems.filter((item) => item.id !== notificationId);
	await persistAndNotify();
}

export async function clearAllUnreadGroupEventNotifications(): Promise<void> {
	await ensureLoaded();
	unreadItems = [];
	await persistAndNotify();
}

export function subscribeUnreadGroupEventNotifications(
	listener: Listener,
): () => void {
	listeners.add(listener);

	void getUnreadGroupEventNotifications().then((items) => {
		if (listeners.has(listener)) {
			listener(items);
		}
	});

	return () => {
		listeners.delete(listener);
	};
}
