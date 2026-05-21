type NuevoEventoPayload = {
    id: string;
    titulo: string;
    categoria: string;
    [key: string]: unknown;
};

type NuevoEventoListener = (payload: NuevoEventoPayload) => void;

const listeners = new Set<NuevoEventoListener>();

export function publishNuevoEvento(payload: NuevoEventoPayload): void {
    listeners.forEach((listener) => listener(payload));
}

export function subscribeNuevoEvento(listener: NuevoEventoListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
