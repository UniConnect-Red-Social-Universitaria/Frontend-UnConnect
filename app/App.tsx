import React, { useEffect } from 'react';
import { LogBox, Platform, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';

import RootNavigator from './src/navigation/RootNavigator';
import { initializeNotifications } from './src/services/notificaciones.service';

// Lock the browser's native scroll so the app manages scrolling internally via ScrollView
if (Platform.OS === 'web') {
	const style = document.createElement('style');
	style.type = 'text/css';
	style.appendChild(
		document.createTextNode(`
			html, body {
				height: 100%;
				width: 100%;
				overflow: hidden;
				margin: 0;
				padding: 0;
			}
			#root {
				height: 100%;
			}
		`)
	);
	document.head.appendChild(style);
}

export default function App() {
	// useWindowDimensions returns the REAL pixel size of the viewport.
	// Setting an explicit pixel `height` on the root View is the definitive fix
	// for React Native Web scroll: flex:1 children only work when an ancestor
	// has a concrete pixel height — '100%' or 'flex:1' alone is not enough
	// when React Navigation inserts multiple intermediate wrapper Views.
	// On native this equals the screen height and has zero visual effect.
	const { height } = useWindowDimensions();

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
		<View style={{ flex: 1, width: '100%', height, overflow: 'hidden' }}>
			<StatusBar style="dark" />
			<RootNavigator />
			<Toast />
		</View>
	);
}
