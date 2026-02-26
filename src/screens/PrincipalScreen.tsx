import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Pressable,
	TextInput,
	FlatList,
	ActivityIndicator,
	TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import globalStyles from '../styles/global';
import { styles } from './PrincipalScreenStyles';
import { resolverApiBaseUrl } from '../utils/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
	Principal: undefined;
	Grupos: undefined;
	Eventos: undefined;
	Contactos: undefined;
	Login: undefined;
	Home: undefined;
};

type PrincipalScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Principal'>;

export default function PrincipalScreen({
	navigation,
}: {
	navigation: PrincipalScreenNavigationProp;
}) {
	const [search, setSearch] = useState('');
	const [results, setResults] = useState<any[]>([]);
	const [companeros, setCompaneros] = useState<string[]>([]); // IDs de compañeros
	const [agregando, setAgregando] = useState<string | null>(null); // ID en proceso de agregar
	// Obtener compañeros al cargar la pantalla
	useEffect(() => {
		const fetchCompaneros = async () => {
			try {
				const apiBaseUrl = resolverApiBaseUrl();
				const token = await AsyncStorage.getItem('userToken');
				const res = await fetch(`${apiBaseUrl}/api/usuarios/companeros`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (data && Array.isArray(data.data)) {
					setCompaneros(data.data.map((c: any) => c.usuario.id));
				} else {
					setCompaneros([]);
				}
			} catch {
				setCompaneros([]);
			}
		};
		fetchCompaneros();
	}, []);
	// Función para agregar compañero
	const handleAgregar = async (usuarioDestinoId: string) => {
		setAgregando(usuarioDestinoId);
		try {
			const apiBaseUrl = resolverApiBaseUrl();
			const token = await AsyncStorage.getItem('userToken');
			const res = await fetch(`${apiBaseUrl}/api/usuarios/solicitudes`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ usuarioDestinoId }),
			});
			const data = await res.json();
			if (data.success) {
				setCompaneros((prev) => [...prev, usuarioDestinoId]);
			} else {
				alert(data.message || 'No se pudo enviar la solicitud');
			}
		} catch {
			alert('Error de red al enviar solicitud');
		}
		setAgregando(null);
	};
	const [loading, setLoading] = useState(false);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLogout = async () => {
		try {
			const apiBaseUrl = resolverApiBaseUrl();
			const token = await AsyncStorage.getItem('userToken');
			await fetch(`${apiBaseUrl}/api/usuarios/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			});
			await AsyncStorage.removeItem('userToken');
			navigation.reset({
				index: 0,
				routes: [{ name: 'Home' }],
			});
		} catch (error: any) {
			console.error('Error en el logout:', error);
			await AsyncStorage.removeItem('userToken');
			navigation.reset({
				index: 0,
				routes: [{ name: 'Home' }],
			});
		}
	};

	// Buscar usuarios por nombre/correo (filtrado en frontend)
	useEffect(() => {
		if (!search.trim()) {
			setResults([]);
			setSearching(false);
			setError(null);
			return;
		}
		let timeout = setTimeout(async () => {
			setSearching(true);
			setError(null);
			try {
				const apiBaseUrl = resolverApiBaseUrl();
				const token = await AsyncStorage.getItem('userToken');
				const res = await fetch(`${apiBaseUrl}/api/usuarios`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				const usuarios = data && Array.isArray(data.data) ? data.data : [];
				// Filtrar por nombre, apellido o correo
				const searchLower = search.trim().toLowerCase();
				const filtered = usuarios.filter(
					(user: { nombre?: string; apellido?: string; correo?: string }) => {
						const nombre = (user.nombre || '').toLowerCase();
						const apellido = (user.apellido || '').toLowerCase();
						const correo = (user.correo || '').toLowerCase();
						return (
							nombre.includes(searchLower) ||
							apellido.includes(searchLower) ||
							correo.includes(searchLower)
						);
					}
				);
				setResults(filtered);
				if (filtered.length === 0) {
					setError('No se encontraron usuarios');
				}
			} catch (e) {
				setResults([]);
				setError('Error de red');
			}
			setSearching(false);
		}, 400);
		return () => clearTimeout(timeout);
	}, [search]);

	return (
		<View style={[globalStyles.container || {}, styles.container]}>
			{/* 1. HEADER*/}
			<View style={styles.header}>
				<Text style={styles.brand}>UniConnect</Text>
				<Pressable
					onPress={handleLogout}
					style={({ pressed }) => [styles.logoutButton, { opacity: pressed ? 0.6 : 1 }]}
				>
					<Text style={styles.logoutText}>Salir</Text>
				</Pressable>
			</View>

			{/* 2. MAIN CONTENT (Middle) */}
			<View style={styles.mainContent}>
				<Text style={styles.greeting}>¡Hola!</Text>
				<Text style={styles.subtitle}>Encuentra tu comunidad en la universidad</Text>

				<View style={styles.searchContainer}>
					<TextInput
						placeholder="Buscar compañeros por nombre o correo..."
						placeholderTextColor="#999"
						style={styles.searchInput}
						value={search}
						onChangeText={setSearch}
					/>
				</View>

				<View style={styles.resultsContainer}>
					<Text style={styles.resultsTitle}>RESULTADOS</Text>
					{searching && (
						<ActivityIndicator size="small" color="#002855" style={{ marginTop: 10 }} />
					)}
					{error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
					{!searching && !error && results.length === 0 && search.trim() !== '' && (
						<Text style={{ color: '#CCC', fontStyle: 'italic', marginTop: 10 }}>
							No se encontraron usuarios.
						</Text>
					)}
					<FlatList
						data={results}
						keyExtractor={(item) => item.id || item._id || item.correo}
						renderItem={({ item }) => (
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									paddingVertical: 10,
									borderBottomWidth: 1,
									borderColor: '#eee',
									justifyContent: 'space-between',
								}}
							>
								<View>
									<Text style={{ fontWeight: 'bold', color: '#002855' }}>
										{item.nombre} {item.apellido}
									</Text>
									<Text style={{ color: '#666' }}>{item.correo}</Text>
								</View>
								{!companeros.includes(item.id) && (
									<Pressable
										onPress={() => handleAgregar(item.id)}
										disabled={agregando === item.id}
										style={{
											backgroundColor: '#003366',
											paddingHorizontal: 14,
											paddingVertical: 6,
											borderRadius: 6,
											opacity: agregando === item.id ? 0.6 : 1,
										}}
									>
										<Text style={{ color: 'white', fontWeight: 'bold' }}>
											{agregando === item.id ? 'Enviando...' : 'Agregar'}
										</Text>
									</Pressable>
								)}
							</View>
						)}
						style={{ maxHeight: 220 }}
					/>
				</View>
			</View>

			{/* 3. BOTTOM BAR*/}
			<View style={styles.bottomBar}>
				<Pressable
					style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.6 : 1 }]}
					onPress={() => navigation.navigate('Grupos')}
				>
					<Text style={styles.navButtonText}>Grupos</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.6 : 1 }]}
					onPress={() => navigation.navigate('Eventos')}
				>
					<Text style={styles.navButtonText}>Eventos</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.6 : 1 }]}
					onPress={() => navigation.navigate('Contactos')}
				>
					<Text style={styles.navButtonText}>Contactos</Text>
				</Pressable>
			</View>
		</View>
	);
}
