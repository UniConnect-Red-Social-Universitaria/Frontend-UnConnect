import Constants from 'expo-constants';

const CHANNEL_ID = 'app-notifications';

let notificationsInitialized = false;
let notificationsModulePromise: Promise<typeof import('expo-notifications') | null> | null = null;

async function getNotificationsModule(): Promise<typeof import('expo-notifications') | null> {
    if (!notificationsModulePromise) {
        notificationsModulePromise = import('expo-notifications')
            .then((module) => module)
            .catch((error) => {
                console.error('[Notifications] Could not load expo-notifications:', error);
                return null;
            });
    }

    return notificationsModulePromise;
}

async function ensureChannel() {
    try {
        const Notifications = await getNotificationsModule();

        if (!Notifications) {
            return;
        }

        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Mensajes UniConnect',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 150, 250],
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    } catch (error) {
        console.error('[Notifications] Error creating channel:', error);
    }
}

export async function ensurePermissions(silentCheck: boolean = false): Promise<boolean> {
    try {
        const Notifications = await getNotificationsModule();

        if (!Notifications) {
            return false;
        }

        await ensureChannel();

        const settings = silentCheck
            ? await Notifications.getPermissionsAsync()
            : await Notifications.requestPermissionsAsync();

        return settings.status === 'granted';
    } catch (error) {
        console.error('[Notifications] Error requesting permissions:', error);
        return false;
    }
}

export async function initializeNotifications(): Promise<void> {
    if (notificationsInitialized) {
        return;
    }

    notificationsInitialized = true;

    const Notifications = await getNotificationsModule();

    if (!Notifications) {
        return;
    }

    await ensurePermissions(false);

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

export async function notifyIncomingMessage(options: {
    title: string;
    body: string;
    data?: Record<string, string>;
}) {
    try {
        const Notifications = await getNotificationsModule();

        if (!Notifications) {
            return;
        }

        await ensureChannel();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: options.title,
                body: options.body,
                data: options.data ?? {},
                sound: true,
            },
            trigger: null,
        });
    } catch (error) {
        console.error('[Notifications] Error scheduling local notification:', error);
    }
}

export async function sendPushTestToCurrentUser() {
    await notifyIncomingMessage({
        title: 'Prueba de UniConnect',
        body: 'Si recibiste esto, las notificaciones locales estan funcionando.',
        data: {
            type: 'test',
            appOwnership: String(Constants.appOwnership ?? 'unknown'),
        },
    });
}

export async function clearDeliveredNotifications(): Promise<void> {
    try {
        const Notifications = await getNotificationsModule();

        if (!Notifications) {
            return;
        }

        await Notifications.dismissAllNotificationsAsync();
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
        console.error('[Notifications] Error clearing notifications:', error);
    }
}

export default {
    initializeNotifications,
    ensurePermissions,
    notifyIncomingMessage,
    sendPushTestToCurrentUser,
    clearDeliveredNotifications,
};
