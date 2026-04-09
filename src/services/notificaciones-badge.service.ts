import AsyncStorage from '@react-native-async-storage/async-storage';

const UNREAD_KEY = 'unreadNotificationsCount';

type Listener = (count: number) => void;

let unreadCount = 0;
let loaded = false;
const listeners = new Set<Listener>();

async function ensureLoaded() {
    if (loaded) {
        return;
    }

    try {
        const raw = await AsyncStorage.getItem(UNREAD_KEY);
        const parsed = raw ? Number(raw) : 0;
        unreadCount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
        unreadCount = 0;
    } finally {
        loaded = true;
    }
}

async function persistAndNotify() {
    try {
        await AsyncStorage.setItem(UNREAD_KEY, String(unreadCount));
    } catch {
        // Keep in-memory value even if persistence fails.
    }

    listeners.forEach((listener) => listener(unreadCount));
}

export async function getUnreadNotificationsCount(): Promise<number> {
    await ensureLoaded();
    return unreadCount;
}

export async function incrementUnreadNotificationsCount(step: number = 1): Promise<void> {
    await ensureLoaded();
    unreadCount += Math.max(1, Math.floor(step));
    await persistAndNotify();
}

export async function clearUnreadNotificationsCount(): Promise<void> {
    await ensureLoaded();
    unreadCount = 0;
    await persistAndNotify();
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
