import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
	getUnreadNotificationsCount,
	subscribeUnreadNotificationsCount,
} from '../services/notificaciones-badge.service';

export function useUnreadNotifications() {
	const [count, setCount] = useState(0);

	useFocusEffect(
		useCallback(() => {
			let mounted = true;

			void getUnreadNotificationsCount().then((c) => {
				if (mounted) setCount(c);
			});

			const unsub = subscribeUnreadNotificationsCount((c) => {
				if (mounted) setCount(c);
			});

			return () => {
				mounted = false;
				unsub();
			};
		}, [])
	);

	return count;
}
