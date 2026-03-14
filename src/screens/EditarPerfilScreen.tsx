import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/PrincipalScreenStyles';

export default function EditarPerfilScreen() {
	return (
		<View
			style={[
				styles.container,
				{ justifyContent: 'center', alignItems: 'center', padding: 24 },
			]}
		>
			<Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
				Editar perfil
			</Text>
			<Text style={{ color: '#666', textAlign: 'center' }}>
				Pantalla en construccion.
			</Text>
		</View>
	);
}
