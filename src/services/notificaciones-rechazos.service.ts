import AsyncStorage from '@react-native-async-storage/async-storage';

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

function sanitizeItems(rawItems: unknown): UnreadRejectedRequestNotification[] {
    if (!Array.isArray(rawItems)) {
        return [];
    }

    return rawItems
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const value = item as Partial<UnreadRejectedRequestNotification>;
            if (!value.solicitudId || typeof value.solicitudId !== 'string') {
                return null;
            }

            const tipo = value.tipo === 'contacto' ? 'contacto' : 'contacto';

            return {
                solicitudId: value.solicitudId,
                solicitanteId:
                    typeof value.solicitanteId === 'string' ? value.solicitanteId : '',
                receptorId: typeof value.receptorId === 'string' ? value.receptorId : '',
                receptorNombre:
                    typeof value.receptorNombre === 'string' && value.receptorNombre.trim().length > 0
                        ? value.receptorNombre.trim()
                        : 'usuario',
                tipo,
                updatedAt:
                    typeof value.updatedAt === 'string'
                        ? value.updatedAt
                        : new Date().toISOString(),
            };
        })
        .filter((item): item is UnreadRejectedRequestNotification => Boolean(item));
}

async function ensureLoaded() {
    if (loaded) {
        return;
    }

    try {
        const raw = await AsyncStorage.getItem(UNREAD_REJECTED_REQUESTS_KEY);
        unreadRejectedRequests = sortByDateDesc(sanitizeItems(raw ? JSON.parse(raw) : []));
    } catch {
        unreadRejectedRequests = [];
    } finally {
        loaded = true;
    }
}

async function persistAndNotify() {
    try {
        await AsyncStorage.setItem(
            UNREAD_REJECTED_REQUESTS_KEY,
            JSON.stringify(unreadRejectedRequests)
        );
    } catch {
        // Keep in-memory data if persistence fails.
    }

    const snapshot = sortByDateDesc(unreadRejectedRequests);
    listeners.forEach((listener) => listener(snapshot));
}

export async function getUnreadRejectedRequestNotifications(): Promise<
    UnreadRejectedRequestNotification[]
> {
    await ensureLoaded();
    unreadRejectedRequests = sortByDateDesc(unreadRejectedRequests);
    return [...unreadRejectedRequests];
}

export async function upsertUnreadRejectedRequestNotification(params: {
    solicitudId: string;
    solicitanteId?: string;
    receptorId?: string;
    receptorNombre?: string;
    tipo?: 'contacto';
    updatedAt?: string;
}): Promise<void> {
    await ensureLoaded();

    const solicitudId = String(params.solicitudId ?? '').trim();
    if (!solicitudId) {
        return;
    }

    const existingIndex = unreadRejectedRequests.findIndex(
        (item) => item.solicitudId === solicitudId
    );

    const nextItem: UnreadRejectedRequestNotification = {
        solicitudId,
        solicitanteId:
            typeof params.solicitanteId === 'string' ? params.solicitanteId : '',
        receptorId: typeof params.receptorId === 'string' ? params.receptorId : '',
        receptorNombre:
            typeof params.receptorNombre === 'string' && params.receptorNombre.trim().length > 0
                ? params.receptorNombre.trim()
                : 'usuario',
        tipo: params.tipo === 'contacto' ? 'contacto' : 'contacto',
        updatedAt:
            typeof params.updatedAt === 'string'
                ? params.updatedAt
                : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
        unreadRejectedRequests[existingIndex] = nextItem;
    } else {
        unreadRejectedRequests.push(nextItem);
    }

    unreadRejectedRequests = sortByDateDesc(unreadRejectedRequests);
    await persistAndNotify();
}

export async function clearUnreadRejectedRequestNotification(
    solicitudId: string
): Promise<void> {
    await ensureLoaded();

    const id = String(solicitudId ?? '').trim();
    if (!id) {
        return;
    }

    unreadRejectedRequests = unreadRejectedRequests.filter(
        (item) => item.solicitudId !== id
    );
    await persistAndNotify();
}

export function subscribeUnreadRejectedRequestNotifications(
    listener: Listener
): () => void {
    listeners.add(listener);

    void getUnreadRejectedRequestNotifications().then((items) => {
        if (listeners.has(listener)) {
            listener(items);
        }
    });

    return () => {
        listeners.delete(listener);
    };
}
