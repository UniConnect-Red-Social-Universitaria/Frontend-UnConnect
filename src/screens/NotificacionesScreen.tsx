import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/PrincipalScreenStyles';

export default function NotificacionesScreen() {
	return (
		<View
			style={[
				styles.container,
				{ justifyContent: 'center', alignItems: 'center', padding: 24 },
			]}
		>
			<Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
				Notificaciones
			</Text>
			<Text style={{ color: '#666', textAlign: 'center' }}>
				Pantalla en construccion.
			</Text>
		</View>
	);
}
