import AsyncStorage from '@react-native-async-storage/async-storage';

const UNREAD_DIRECT_CHATS_KEY = 'unreadDirectChatNotifications';

export type UnreadDirectChatNotification = {
    contactoId: string;
    nombre: string;
    ultimoMensaje: string;
    updatedAt: string;
    mensajesNoLeidos: number;
};

type Listener = (items: UnreadDirectChatNotification[]) => void;

let loaded = false;
let unreadDirectChats: UnreadDirectChatNotification[] = [];
const listeners = new Set<Listener>();

function sortByDateDesc(items: UnreadDirectChatNotification[]) {
    return [...items].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

function sanitizeItems(rawItems: unknown): UnreadDirectChatNotification[] {
    if (!Array.isArray(rawItems)) {
        return [];
    }

    return rawItems
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const value = item as Partial<UnreadDirectChatNotification>;
            if (!value.contactoId || typeof value.contactoId !== 'string') {
                return null;
            }

            return {
                contactoId: value.contactoId,
                nombre:
                    typeof value.nombre === 'string' && value.nombre.trim().length > 0
                        ? value.nombre.trim()
                        : 'Usuario',
                ultimoMensaje:
                    typeof value.ultimoMensaje === 'string' ? value.ultimoMensaje : '',
                updatedAt:
                    typeof value.updatedAt === 'string'
                        ? value.updatedAt
                        : new Date().toISOString(),
                mensajesNoLeidos:
                    Number.isFinite(value.mensajesNoLeidos) && (value.mensajesNoLeidos ?? 0) > 0
                        ? Math.floor(value.mensajesNoLeidos as number)
                        : 1,
            };
        })
        .filter((item): item is UnreadDirectChatNotification => Boolean(item));
}

async function ensureLoaded() {
    if (loaded) {
        return;
    }

    try {
        const raw = await AsyncStorage.getItem(UNREAD_DIRECT_CHATS_KEY);
        unreadDirectChats = sortByDateDesc(sanitizeItems(raw ? JSON.parse(raw) : []));
    } catch {
        unreadDirectChats = [];
    } finally {
        loaded = true;
    }
}

async function persistAndNotify() {
    try {
        await AsyncStorage.setItem(
            UNREAD_DIRECT_CHATS_KEY,
            JSON.stringify(unreadDirectChats)
        );
    } catch {
        // Keep in-memory data if persistence fails.
    }

    const snapshot = sortByDateDesc(unreadDirectChats);
    listeners.forEach((listener) => listener(snapshot));
}

export async function getUnreadDirectChatNotifications(): Promise<
    UnreadDirectChatNotification[]
> {
    await ensureLoaded();
    unreadDirectChats = sortByDateDesc(unreadDirectChats);
    return [...unreadDirectChats];
}

export async function upsertUnreadDirectChatNotification(params: {
    contactoId: string;
    nombre?: string;
    mensaje?: string;
}): Promise<void> {
    await ensureLoaded();

    const contactoId = String(params.contactoId ?? '').trim();
    if (!contactoId) {
        return;
    }

    const nombre =
        typeof params.nombre === 'string' && params.nombre.trim().length > 0
            ? params.nombre.trim()
            : 'Usuario';
    const mensaje =
        typeof params.mensaje === 'string' ? params.mensaje.trim() : '';

    const existingIndex = unreadDirectChats.findIndex(
        (item) => item.contactoId === contactoId
    );

    if (existingIndex >= 0) {
        const existing = unreadDirectChats[existingIndex];
        unreadDirectChats[existingIndex] = {
            ...existing,
            nombre: nombre.length > 0 ? nombre : existing.nombre,
            ultimoMensaje: mensaje.length > 0 ? mensaje : existing.ultimoMensaje,
            updatedAt: new Date().toISOString(),
            mensajesNoLeidos: existing.mensajesNoLeidos + 1,
        };
    } else {
        unreadDirectChats.push({
            contactoId,
            nombre,
            ultimoMensaje: mensaje,
            updatedAt: new Date().toISOString(),
            mensajesNoLeidos: 1,
        });
    }

    unreadDirectChats = sortByDateDesc(unreadDirectChats);
    await persistAndNotify();
}

export async function clearUnreadDirectChatNotification(
    contactoId: string
): Promise<void> {
    await ensureLoaded();

    const id = String(contactoId ?? '').trim();
    if (!id) {
        return;
    }

    unreadDirectChats = unreadDirectChats.filter((item) => item.contactoId !== id);
    await persistAndNotify();
}

export function subscribeUnreadDirectChatNotifications(
    listener: Listener
): () => void {
    listeners.add(listener);

    void getUnreadDirectChatNotifications().then((items) => {
        if (listeners.has(listener)) {
            listener(items);
        }
    });

    return () => {
        listeners.delete(listener);
    };
}
