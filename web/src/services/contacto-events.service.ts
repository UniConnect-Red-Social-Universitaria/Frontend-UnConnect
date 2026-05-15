// Copia exacta del de la app — sin AsyncStorage, sin dependencias nativas
type ContactRequestRejectedPayload = {
	solicitudId: string;
	solicitanteId: string;
	receptorId: string;
	updatedAt?: string;
};

type ContactRequestRejectionSeenPayload = {
	solicitudId: string;
	receptorId: string;
};

type ContactRequestRejectedListener = (payload: ContactRequestRejectedPayload) => void;
type ContactRequestRejectionSeenListener = (payload: ContactRequestRejectionSeenPayload) => void;

const rejectedListeners = new Set<ContactRequestRejectedListener>();
const rejectionSeenListeners = new Set<ContactRequestRejectionSeenListener>();

export function publishContactRequestRejected(payload: ContactRequestRejectedPayload) {
	rejectedListeners.forEach((l) => l(payload));
}

export function subscribeContactRequestRejected(
	listener: ContactRequestRejectedListener
): () => void {
	rejectedListeners.add(listener);
	return () => rejectedListeners.delete(listener);
}

export function publishContactRequestRejectionSeen(
	payload: ContactRequestRejectionSeenPayload
) {
	rejectionSeenListeners.forEach((l) => l(payload));
}

export function subscribeContactRequestRejectionSeen(
	listener: ContactRequestRejectionSeenListener
): () => void {
	rejectionSeenListeners.add(listener);
	return () => rejectionSeenListeners.delete(listener);
}
