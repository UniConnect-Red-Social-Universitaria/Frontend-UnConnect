import AsyncStorage from '@react-native-async-storage/async-storage';

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

function sanitizeItems(rawItems: unknown): UnreadContactRequestNotification[] {
    if (!Array.isArray(rawItems)) {
        return [];
    }

    return rawItems
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const value = item as Partial<UnreadContactRequestNotification>;
            if (!value.solicitudId || typeof value.solicitudId !== 'string') {
                return null;
            }

            return {
                solicitudId: value.solicitudId,
                solicitanteId:
                    typeof value.solicitanteId === 'string' ? value.solicitanteId : '',
                nombre:
                    typeof value.nombre === 'string' && value.nombre.trim().length > 0
                        ? value.nombre.trim()
                        : 'Usuario',
                createdAt:
                    typeof value.createdAt === 'string'
                        ? value.createdAt
                        : new Date().toISOString(),
            };
        })
        .filter((item): item is UnreadContactRequestNotification => Boolean(item));
}

async function ensureLoaded() {
    if (loaded) {
        return;
    }

    try {
        const raw = await AsyncStorage.getItem(UNREAD_CONTACT_REQUESTS_KEY);
        unreadRequests = sortByDateDesc(sanitizeItems(raw ? JSON.parse(raw) : []));
    } catch {
        unreadRequests = [];
    } finally {
        loaded = true;
    }
}

async function persistAndNotify() {
    try {
        await AsyncStorage.setItem(
            UNREAD_CONTACT_REQUESTS_KEY,
            JSON.stringify(unreadRequests)
        );
    } catch {
        // Keep in-memory data if persistence fails.
    }

    const snapshot = sortByDateDesc(unreadRequests);
    listeners.forEach((listener) => listener(snapshot));
}

export async function getUnreadContactRequestNotifications(): Promise<
    UnreadContactRequestNotification[]
> {
    await ensureLoaded();
    unreadRequests = sortByDateDesc(unreadRequests);
    return [...unreadRequests];
}

export async function upsertUnreadContactRequestNotification(params: {
    solicitudId: string;
    solicitanteId?: string;
    nombre?: string;
}): Promise<void> {
    await ensureLoaded();

    const solicitudId = String(params.solicitudId ?? '').trim();
    if (!solicitudId) {
        return;
    }

    const existingIndex = unreadRequests.findIndex(
        (item) => item.solicitudId === solicitudId
    );

    const nextItem: UnreadContactRequestNotification = {
        solicitudId,
        solicitanteId:
            typeof params.solicitanteId === 'string' ? params.solicitanteId : '',
        nombre:
            typeof params.nombre === 'string' && params.nombre.trim().length > 0
                ? params.nombre.trim()
                : 'Usuario',
        createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
        unreadRequests[existingIndex] = nextItem;
    } else {
        unreadRequests.push(nextItem);
    }

    unreadRequests = sortByDateDesc(unreadRequests);
    await persistAndNotify();
}

export async function clearUnreadContactRequestNotification(
    solicitudId: string
): Promise<void> {
    await ensureLoaded();

    const id = String(solicitudId ?? '').trim();
    if (!id) {
        return;
    }

    unreadRequests = unreadRequests.filter((item) => item.solicitudId !== id);
    await persistAndNotify();
}

export function subscribeUnreadContactRequestNotifications(
    listener: Listener
): () => void {
    listeners.add(listener);

    void getUnreadContactRequestNotifications().then((items) => {
        if (listeners.has(listener)) {
            listener(items);
        }
    });

    return () => {
        listeners.delete(listener);
    };
}
