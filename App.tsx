import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import RootNavigator from './src/navigation/RootNavigator';
import { initializeNotifications } from './src/services/notificaciones.service';

export default function App() {
	useEffect(() => {
		initializeNotifications().catch((error) => {
			console.error('[Notifications] Bootstrap error:', error);
		});
	}, []);

	return (
		<>
			<StatusBar style="dark" />

			<RootNavigator />

			<Toast />
		</>
	);
}
