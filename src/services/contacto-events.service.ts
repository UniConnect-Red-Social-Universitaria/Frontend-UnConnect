type ContactRequestRejectedPayload = {
    solicitudId: string;
    solicitanteId: string;
    receptorId: string;
    updatedAt?: string;
};

type ContactRequestRejectedListener = (
    payload: ContactRequestRejectedPayload,
) => void;

const rejectedListeners = new Set<ContactRequestRejectedListener>();

export function publishContactRequestRejected(payload: ContactRequestRejectedPayload) {
    rejectedListeners.forEach((listener) => listener(payload));
}

export function subscribeContactRequestRejected(
    listener: ContactRequestRejectedListener,
): () => void {
    rejectedListeners.add(listener);

    return () => {
        rejectedListeners.delete(listener);
    };
}
