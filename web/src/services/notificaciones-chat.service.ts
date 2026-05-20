const UNREAD_DIRECT_CHAT_KEY = 'unreadDirectChatNotifications';
const UNREAD_GROUP_CHAT_KEY = 'unreadGroupChatNotifications';

export type UnreadDirectChatNotification = {
  contactoId: string;
  nombre: string;
  mensaje: string;
  count: number;
  updatedAt: string;
};

export type UnreadGroupChatNotification = {
  grupoId: string;
  nombreGrupo: string;
  mensaje: string;
  count: number;
  updatedAt: string;
};

type DirectListener = (items: UnreadDirectChatNotification[]) => void;
type GroupListener = (items: UnreadGroupChatNotification[]) => void;

let directLoaded = false;
let groupLoaded = false;
let directItems: UnreadDirectChatNotification[] = [];
let groupItems: UnreadGroupChatNotification[] = [];
const directListeners = new Set<DirectListener>();
const groupListeners = new Set<GroupListener>();

function ensureDirectLoaded() {
  if (directLoaded) return;
  try {
    const raw = localStorage.getItem(UNREAD_DIRECT_CHAT_KEY);
    directItems = raw ? JSON.parse(raw) : [];
  } catch {
    directItems = [];
  } finally {
    directLoaded = true;
  }
}

function persistAndNotifyDirect() {
  try {
    localStorage.setItem(UNREAD_DIRECT_CHAT_KEY, JSON.stringify(directItems));
  } catch {}
  directListeners.forEach((l) => l([...directItems]));
}

export async function upsertUnreadDirectChatNotification(params: {
  contactoId: string;
  nombre: string;
  mensaje: string;
}): Promise<void> {
  ensureDirectLoaded();
  const idx = directItems.findIndex((i) => i.contactoId === params.contactoId);
  if (idx >= 0) {
    directItems[idx] = {
      ...directItems[idx],
      nombre: params.nombre,
      mensaje: params.mensaje,
      count: directItems[idx].count + 1,
      updatedAt: new Date().toISOString(),
    };
  } else {
    directItems.push({
      contactoId: params.contactoId,
      nombre: params.nombre,
      mensaje: params.mensaje,
      count: 1,
      updatedAt: new Date().toISOString(),
    });
  }
  persistAndNotifyDirect();
}

export async function clearUnreadDirectChatNotification(contactoId: string): Promise<void> {
  ensureDirectLoaded();
  const removed = directItems.filter((i) => i.contactoId === contactoId).length;
  directItems = directItems.filter((i) => i.contactoId !== contactoId);
  persistAndNotifyDirect();
  if (removed > 0) {
    const { decrementUnreadNotificationsCount } = await import('./notificaciones-badge.service');
    await decrementUnreadNotificationsCount(removed);
  }
}

export async function getUnreadDirectChatNotifications(): Promise<UnreadDirectChatNotification[]> {
  ensureDirectLoaded();
  return [...directItems];
}

export function subscribeUnreadDirectChatNotifications(listener: DirectListener): () => void {
  directListeners.add(listener);
  void getUnreadDirectChatNotifications().then((items) => {
    if (directListeners.has(listener)) listener(items);
  });
  return () => directListeners.delete(listener);
}

function ensureGroupLoaded() {
  if (groupLoaded) return;
  try {
    const raw = localStorage.getItem(UNREAD_GROUP_CHAT_KEY);
    groupItems = raw ? JSON.parse(raw) : [];
  } catch {
    groupItems = [];
  } finally {
    groupLoaded = true;
  }
}

function persistAndNotifyGroup() {
  try {
    localStorage.setItem(UNREAD_GROUP_CHAT_KEY, JSON.stringify(groupItems));
  } catch {}
  groupListeners.forEach((l) => l([...groupItems]));
}

export async function upsertUnreadGroupChatNotification(params: {
  grupoId: string;
  nombreGrupo: string;
  mensaje: string;
}): Promise<void> {
  ensureGroupLoaded();
  const idx = groupItems.findIndex((i) => i.grupoId === params.grupoId);
  if (idx >= 0) {
    groupItems[idx] = {
      ...groupItems[idx],
      nombreGrupo: params.nombreGrupo,
      mensaje: params.mensaje,
      count: groupItems[idx].count + 1,
      updatedAt: new Date().toISOString(),
    };
  } else {
    groupItems.push({
      grupoId: params.grupoId,
      nombreGrupo: params.nombreGrupo,
      mensaje: params.mensaje,
      count: 1,
      updatedAt: new Date().toISOString(),
    });
  }
  persistAndNotifyGroup();
}

export async function clearUnreadGroupChatNotification(grupoId: string): Promise<void> {
  ensureGroupLoaded();
  const removed = groupItems.filter((i) => i.grupoId === grupoId).length;
  groupItems = groupItems.filter((i) => i.grupoId !== grupoId);
  persistAndNotifyGroup();
  if (removed > 0) {
    const { decrementUnreadNotificationsCount } = await import('./notificaciones-badge.service');
    await decrementUnreadNotificationsCount(removed);
  }
}

export async function getUnreadGroupChatNotifications(): Promise<UnreadGroupChatNotification[]> {
  ensureGroupLoaded();
  return [...groupItems];
}

export function subscribeUnreadGroupChatNotifications(listener: GroupListener): () => void {
  groupListeners.add(listener);
  void getUnreadGroupChatNotifications().then((items) => {
    if (groupListeners.has(listener)) listener(items);
  });
  return () => groupListeners.delete(listener);
}