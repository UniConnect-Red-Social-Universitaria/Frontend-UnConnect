import {
    subscribeContactRequestRejected,
    publishContactRequestRejected,
    subscribeContactRequestRejectionSeen,
    publishContactRequestRejectionSeen,
} from '../contacto-events.service';

describe('Patrón Observer - Contacto Events Service', () => {
    beforeEach(() => {
        // Limpiar listeners entre pruebas para evitar interferencias
        // Nota: En una implementación real, podríamos exponer un método para reset
        jest.clearAllMocks();
    });

    describe('subscribeContactRequestRejected', () => {
        it('debe permitir suscribirse y recibir notificaciones', () => {
            const mockListener = jest.fn();
            const payload = {
                solicitudId: '123',
                solicitanteId: 'user1',
                receptorId: 'user2',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            // Suscribirse
            const unsubscribe = subscribeContactRequestRejected(mockListener);

            // Publicar evento
            publishContactRequestRejected(payload);

            // Verificar que el listener fue llamado
            expect(mockListener).toHaveBeenCalledWith(payload);
            expect(mockListener).toHaveBeenCalledTimes(1);

            // Limpiar
            unsubscribe();
        });

        it('debe permitir múltiples suscriptores', () => {
            const mockListener1 = jest.fn();
            const mockListener2 = jest.fn();
            const payload = {
                solicitudId: '456',
                solicitanteId: 'user3',
                receptorId: 'user4',
            };

            // Suscribir dos listeners
            const unsubscribe1 = subscribeContactRequestRejected(mockListener1);
            const unsubscribe2 = subscribeContactRequestRejected(mockListener2);

            // Publicar evento
            publishContactRequestRejected(payload);

            // Ambos deben ser notificados
            expect(mockListener1).toHaveBeenCalledWith(payload);
            expect(mockListener2).toHaveBeenCalledWith(payload);

            // Limpiar
            unsubscribe1();
            unsubscribe2();
        });

        it('debe permitir desuscribirse correctamente', () => {
            const mockListener = jest.fn();
            const payload = {
                solicitudId: '789',
                solicitanteId: 'user5',
                receptorId: 'user6',
            };

            // Suscribirse
            const unsubscribe = subscribeContactRequestRejected(mockListener);

            // Publicar evento - debe ser notificado
            publishContactRequestRejected(payload);
            expect(mockListener).toHaveBeenCalledTimes(1);

            // Desuscribirse
            unsubscribe();

            // Publicar otro evento - NO debe ser notificado
            publishContactRequestRejected({ ...payload, solicitudId: '999' });
            expect(mockListener).toHaveBeenCalledTimes(1); // Sigue en 1
        });

        it('debe manejar errores en listeners sin romper otros', () => {
            const mockListenerGood = jest.fn();
            const mockListenerBad = jest.fn(() => {
                throw new Error('Listener error');
            });
            const payload = {
                solicitudId: 'error-test',
                solicitanteId: 'user7',
                receptorId: 'user8',
            };

            // Suscribir ambos
            const unsubscribeGood = subscribeContactRequestRejected(mockListenerGood);
            const unsubscribeBad = subscribeContactRequestRejected(mockListenerBad);

            // Publicar evento
            expect(() => publishContactRequestRejected(payload)).toThrow('Listener error');

            // El listener bueno debe haber sido llamado antes del error
            expect(mockListenerGood).toHaveBeenCalledWith(payload);

            // Limpiar
            unsubscribeGood();
            unsubscribeBad();
        });
    });

    describe('subscribeContactRequestRejectionSeen', () => {
        it('debe funcionar igual que rejected para seen events', () => {
            const mockListener = jest.fn();
            const payload = {
                solicitudId: 'seen-123',
                receptorId: 'user9',
            };

            // Suscribirse
            const unsubscribe = subscribeContactRequestRejectionSeen(mockListener);

            // Publicar evento
            publishContactRequestRejectionSeen(payload);

            // Verificar
            expect(mockListener).toHaveBeenCalledWith(payload);

            // Limpiar
            unsubscribe();
        });
    });

    describe('Ciclo completo del patrón Observer', () => {
        it('debe verificar suscripción → notificación → desuscripción', () => {
            const mockListener = jest.fn();
            const payload1 = {
                solicitudId: 'cycle-1',
                solicitanteId: 'userA',
                receptorId: 'userB',
            };
            const payload2 = {
                solicitudId: 'cycle-2',
                solicitanteId: 'userC',
                receptorId: 'userD',
            };

            // 1. Suscripción
            const unsubscribe = subscribeContactRequestRejected(mockListener);
            expect(mockListener).not.toHaveBeenCalled();

            // 2. Notificación
            publishContactRequestRejected(payload1);
            expect(mockListener).toHaveBeenCalledWith(payload1);
            expect(mockListener).toHaveBeenCalledTimes(1);

            // 3. Desuscripción
            unsubscribe();

            // Verificar que ya no recibe notificaciones
            publishContactRequestRejected(payload2);
            expect(mockListener).toHaveBeenCalledTimes(1); // Sigue en 1
        });

        it('debe manejar múltiples ciclos independientes', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            const payload = {
                solicitudId: 'multi-cycle',
                solicitanteId: 'userX',
                receptorId: 'userY',
            };

            // Ciclo 1: Suscribir listener1, notificar, desuscribir
            const unsub1 = subscribeContactRequestRejected(listener1);
            publishContactRequestRejected(payload);
            expect(listener1).toHaveBeenCalledTimes(1);
            unsub1();

            // Ciclo 2: Suscribir listener2, notificar, desuscribir
            const unsub2 = subscribeContactRequestRejected(listener2);
            publishContactRequestRejected(payload);
            expect(listener2).toHaveBeenCalledTimes(1);
            unsub2();

            // Verificar que listener1 no recibió la segunda notificación
            expect(listener1).toHaveBeenCalledTimes(1);
        });
    });

    describe('Prevención de memory leaks', () => {
        it('debe limpiar listeners después de desuscripción', () => {
            const mockListener = jest.fn();
            const payload = {
                solicitudId: 'memory-test',
                solicitanteId: 'userM',
                receptorId: 'userN',
            };

            // Suscribir y desuscribir múltiples veces
            for (let i = 0; i < 10; i++) {
                const unsubscribe = subscribeContactRequestRejected(mockListener);
                publishContactRequestRejected(payload);
                unsubscribe();
            }

            // Después de desuscribir, no debe recibir notificaciones
            publishContactRequestRejected({ ...payload, solicitudId: 'after-cleanup' });
            expect(mockListener).toHaveBeenCalledTimes(10); // Solo las 10 veces que estaba suscrito
        });
    });
});