import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';

import RootNavigator from './src/navigation/RootNavigator';
import { initializeNotifications } from './src/services/notificaciones.service';

export default function App() {
	useEffect(() => {
		if (Constants.appOwnership === 'expo') {
			LogBox.ignoreLogs([
				'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
				'`expo-notifications` functionality is not fully supported in Expo Go',
			]);
		}

		initializeNotifications().catch((error: unknown) => {
			console.error('[App] Error initializing notifications:', error);
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
