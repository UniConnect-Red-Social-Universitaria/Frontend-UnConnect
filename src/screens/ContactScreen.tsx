import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
	View,
	Text,
	Image,
	FlatList,
	StyleSheet,
	ListRenderItem,
	SafeAreaView,
	Pressable,
	Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolverApiBaseUrl } from '../utils/apiConfig';

type Contacto = {
	id: string;
	nombre: string;
	correo: string;
};

export default function ContactScreen() {
	const navigation =
		useNavigation<StackNavigationProp<RootStackParamList, 'Contactos'>>();

	const [contactos, setContactos] = useState<Contacto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			setLoading(true);
			setError(null);

			try {
				const token = await AsyncStorage.getItem('userToken');

				if (!token) {
					setError('No autenticado');
					setContactos([]);
					setLoading(false);
					return;
				}

				const apiBaseUrl = resolverApiBaseUrl();
				const res = await fetch(`${apiBaseUrl}/api/usuarios/companeros`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				const data = await res.json();

				if (data.success && Array.isArray(data.data)) {
					setContactos(
						data.data.map((c: any) => ({
							id: c.usuario?.id || c.contactoId || '',
							nombre: c.usuario?.nombre || '',
							correo: c.usuario?.correo || '',
						}))
					);
				} else {
					setContactos([]);
					setError(data.message || 'Error al cargar contactos');
				}
			} catch (e) {
				setError('Error de red');
			}

			setLoading(false);
		})();
	}, []);

	const renderItem: ListRenderItem<Contacto> = ({ item }) => (
		<View style={styles.card}>
			<View style={styles.infoContainer}>
				<Text style={styles.name}>{item.nombre}</Text>
				<Text style={styles.email}>{item.correo}</Text>
			</View>

			<Pressable
				style={({ pressed }) => [styles.messageButton, pressed && { opacity: 0.8 }]}
				onPress={() =>
					navigation.navigate('MensajeDirecto', {
						contactoId: item.id,
						nombre: item.nombre,
						correo: item.correo,
					})
				}
			>
				<Text style={styles.messageButtonText}>Mensaje</Text>
			</Pressable>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			{/* 🔵 HEADER */}
			<View style={styles.header}>
				<View style={styles.headerContent}>
					<Image
						source={require('../../assets/images/logo-caldas.png')}
						style={styles.logo}
						resizeMode="contain"
					/>
					<Text style={styles.appName}>UniConnect</Text>
				</View>
			</View>

			{/* 🔹 CONTENIDO FLEXIBLE */}
			<View style={styles.content}>
				{loading ? (
					<Text style={styles.centerText}>Cargando contactos...</Text>
				) : error ? (
					<Text style={[styles.centerText, { color: 'red' }]}>{error}</Text>
				) : contactos.length === 0 ? (
					<Text style={styles.centerText}>No tienes contactos agregados aún.</Text>
				) : (
					<FlatList<Contacto>
						style={{ flex: 1 }}
						data={contactos}
						keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
						renderItem={renderItem}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.listContent}
						ListHeaderComponent={
							<View style={styles.screenHeader}>
								<Text style={styles.title}>Contactos</Text>
								<Text style={styles.subtitle}>
									Aquí podrás ver y gestionar tus contactos de UniConnect.
								</Text>
							</View>
						}
					/>
				)}
			</View>

			{/* 🔵 FOOTER FIJO */}
			<View style={styles.footer}>
				<Text style={styles.footerText}>UniConnect © 2026</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8fafc',
	},

	header: {
		height: 70,
		backgroundColor: '#002855',
		justifyContent: 'center',
		paddingHorizontal: 16,
	},

	headerContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	logo: {
		width: 36,
		height: 36,
		marginRight: 10,
	},

	appName: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},

	content: {
		flex: 1,
	},

	centerText: {
		textAlign: 'center',
		color: '#64748b',
		fontSize: 15,
		paddingHorizontal: 20,
		marginTop: 30,
	},

	listContent: {
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 20,
	},

	screenHeader: {
		marginBottom: 20,
	},

	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#002855',
		marginBottom: 4,
	},

	subtitle: {
		fontSize: 14,
		color: '#64748b',
	},

	card: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 18,
		marginBottom: 16,
		shadowColor: '#002855',
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 3,
		borderWidth: 1,
		borderColor: '#e0e7ef',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},

	infoContainer: {
		flex: 1,
		marginRight: 12,
	},

	name: {
		fontWeight: 'bold',
		fontSize: 17,
		color: '#002855',
		marginBottom: 2,
	},

	email: {
		color: '#666',
		fontSize: 15,
	},

	messageButton: {
		backgroundColor: '#002855',
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 8,
	},

	messageButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 14,
	},

	footer: {
		height: 60,
		backgroundColor: '#002855',
		justifyContent: 'center',
		alignItems: 'center',
	},

	footerText: {
		color: '#fff',
		fontWeight: '600',
	},
});
