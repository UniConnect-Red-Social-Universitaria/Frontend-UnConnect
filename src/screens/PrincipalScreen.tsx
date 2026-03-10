import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Pressable,
	TextInput,
	ActivityIndicator,
	ScrollView,
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

const normalizarTexto = (texto: string) =>
	texto
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');

export default function PrincipalScreen({
	navigation,
}: {
	navigation: PrincipalScreenNavigationProp;
}) {
	const [search, setSearch] = useState('');
	const [results, setResults] = useState<any[]>([]);
	const [grupoResults, setGrupoResults] = useState<any[]>([]);
	const [materiaResults, setMateriaResults] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const handleLogout = async () => {
		try {
			await AsyncStorage.removeItem('userToken');
			navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
		} catch (err) {
			console.log('Error al cerrar sesión:', err);
		}
	};

	useEffect(() => {
		setLoading(false);
	}, []);

	useEffect(() => {
		const buscarEnBackend = async () => {
			try {
				const apiBaseUrl = resolverApiBaseUrl();
				const token = await AsyncStorage.getItem('userToken');
				const query = encodeURIComponent(search.trim());

				const [usuariosMateriasRes, gruposRes] = await Promise.all([
					fetch(`${apiBaseUrl}/api/usuarios/buscar?q=${query}`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch(`${apiBaseUrl}/api/grupos/buscar?q=${query}`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
				]);

				const [usuariosMateriasData, gruposData] = await Promise.all([
					usuariosMateriasRes.json(),
					gruposRes.json(),
				]);

				if (usuariosMateriasData.success) {
					setResults(Array.isArray(usuariosMateriasData.data?.estudiantes) ? usuariosMateriasData.data.estudiantes : []);
					setMateriaResults(Array.isArray(usuariosMateriasData.data?.materias) ? usuariosMateriasData.data.materias : []);
				} else {
					setResults([]);
					setMateriaResults([]);
				}

				if (gruposData.success) {
					setGrupoResults(Array.isArray(gruposData.data) ? gruposData.data : []);
				} else {
					setGrupoResults([]);
				}
			} catch (error) {
				console.log('Error buscando en backend:', error);
				setResults([]);
				setGrupoResults([]);
				setMateriaResults([]);
			}
		};

		if (!search.trim()) {
			setResults([]);
			setGrupoResults([]);
			setMateriaResults([]);
			return;
		}

		const timeoutId = setTimeout(() => {
			buscarEnBackend();
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [search]);

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center' }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* HEADER */}
			<View style={styles.header}>
				<Text style={styles.brand}>UniConnect</Text>
				{/* botón salir */}
				<Pressable style={styles.logoutButton} onPress={handleLogout}>
					<Text style={styles.logoutText}>Salir</Text>
				</Pressable>
			</View>

			{/* MAIN */}
			<View style={styles.mainContent}>
				<Text style={styles.greeting}>¡Hola!</Text>
				<Text style={styles.subtitle}>Encuentra tu comunidad en la universidad</Text>

				<View style={styles.searchContainer}>
					<TextInput
						placeholder="Buscar usuarios, grupos o materias..."
						placeholderTextColor="#999"
						style={styles.searchInput}
						value={search}
						onChangeText={setSearch}
					/>
				</View>

				<ScrollView style={{ marginTop: 10 }}>
					{/* Usuarios */}
					{results.length > 0 && (
						<>
							<Text style={styles.resultsTitle}>Usuarios</Text>
							{results.map((item) => (
								<View key={item.id || item._id} style={{ paddingVertical: 6 }}>
									<Text style={{ fontWeight: 'bold' }}>
										{item.nombre} {item.apellido}
									</Text>
									<Text>{item.correo}</Text>
								</View>
							))}
						</>
					)}

					{/* Grupos */}
					{grupoResults.length > 0 && (
						<>
							<Text style={styles.resultsTitle}>Grupos</Text>
							{grupoResults.map((item) => (
								<View key={item.id || item._id} style={{ paddingVertical: 6 }}>
									<Text style={{ fontWeight: 'bold' }}>{item.nombre}</Text>
									<Text>Materia: {item.materia?.nombre}</Text>
								</View>
							))}
						</>
					)}

					{/* Materias */}
					{materiaResults.length > 0 && (
						<>
							<Text style={styles.resultsTitle}>Materias</Text>
							{materiaResults.map((item) => (
								<View key={item.id || item._id} style={{ paddingVertical: 6 }}>
									<Text style={{ fontWeight: 'bold' }}>{item.nombre}</Text>
								</View>
							))}
						</>
					)}

					{results.length === 0 &&
						grupoResults.length === 0 &&
						materiaResults.length === 0 &&
						search.trim() !== '' && (
							<Text style={{ color: '#CCC', marginTop: 10 }}>
								No se encontraron resultados.
							</Text>
						)}
				</ScrollView>
			</View>

			{/* FOOTER */}
			<View style={styles.bottomBar}>
				<Pressable onPress={() => navigation.navigate('Grupos')}>
					<Text style={styles.navButtonText}>Grupos</Text>
				</Pressable>

				<Pressable onPress={() => navigation.navigate('Eventos')}>
					<Text style={styles.navButtonText}>Eventos</Text>
				</Pressable>

				<Pressable onPress={() => navigation.navigate('Contactos')}>
					<Text style={styles.navButtonText}>Contactos</Text>
				</Pressable>
			</View>
		</View>
	);
}
