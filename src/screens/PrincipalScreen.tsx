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

type PrincipalScreenNavigationProp =
	StackNavigationProp<RootStackParamList, 'Principal'>;

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
	const [usuarios, setUsuarios] = useState<any[]>([]);
	const [grupos, setGrupos] = useState<any[]>([]);
	const [materias, setMaterias] = useState<any[]>([]);
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
		const fetchData = async () => {
			try {
				const apiBaseUrl = resolverApiBaseUrl();
				const token = await AsyncStorage.getItem('userToken');

				const resUsuarios = await fetch(`${apiBaseUrl}/api/usuarios`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const dataUsuarios = await resUsuarios.json();
				if (dataUsuarios.success) {
					setUsuarios(
						Array.isArray(dataUsuarios.data)
							? dataUsuarios.data
							: []
					);
				}

				const resGrupos = await fetch(`${apiBaseUrl}/api/grupos`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const dataGrupos = await resGrupos.json();
				if (dataGrupos.success) {
					setGrupos(
						Array.isArray(dataGrupos.data)
							? dataGrupos.data
							: []
					);
				}

				const resMaterias = await fetch(`${apiBaseUrl}/api/catalogos`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const dataMaterias = await resMaterias.json();

				if (dataMaterias.success) {
					let materiasExtraidas: any[] = [];

					if (Array.isArray(dataMaterias.data)) {
						materiasExtraidas = dataMaterias.data;
					} else if (Array.isArray(dataMaterias.data?.materias)) {
						materiasExtraidas = dataMaterias.data.materias;
					}

					setMaterias(materiasExtraidas);
				}
			} catch (error) {
				console.log('Error cargando datos:', error);
			}
			setLoading(false);
		};

		fetchData();
	}, []);

	useEffect(() => {
		if (!search.trim()) {
			setResults([]);
			setGrupoResults([]);
			setMateriaResults([]);
			return;
		}

		const textoBusqueda = normalizarTexto(search);

		const usuariosFiltrados = usuarios.filter((u) => {
			const nombre = normalizarTexto(u.nombre || '');
			const apellido = normalizarTexto(u.apellido || '');
			const correo = normalizarTexto(u.correo || '');

			return (
				nombre.includes(textoBusqueda) ||
				apellido.includes(textoBusqueda) ||
				correo.includes(textoBusqueda)
			);
		});

		const gruposFiltrados = grupos.filter((g) => {
			const nombreGrupo = normalizarTexto(g.nombre || '');
			const nombreMateria = normalizarTexto(
				g.materia?.nombre || ''
			);

			return (
				nombreGrupo.includes(textoBusqueda) ||
				nombreMateria.includes(textoBusqueda)
			);
		});

		const materiasFiltradas = materias.filter((m) => {
			const nombreMateria = normalizarTexto(m.nombre || '');
			return nombreMateria.includes(textoBusqueda);
		});

		setResults(usuariosFiltrados);
		setGrupoResults(gruposFiltrados);
		setMateriaResults(materiasFiltradas);
	}, [search, usuarios, grupos, materias]);

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center' }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<View style={[globalStyles.container || {}, styles.container]}>
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
				<Text style={styles.subtitle}>
					Encuentra tu comunidad en la universidad
				</Text>

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
								<View
									key={item.id || item._id}
									style={{ paddingVertical: 6 }}
								>
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
								<View
									key={item.id || item._id}
									style={{ paddingVertical: 6 }}
								>
									<Text style={{ fontWeight: 'bold' }}>
										{item.nombre}
									</Text>
									<Text>
										Materia: {item.materia?.nombre}
									</Text>
								</View>
							))}
						</>
					)}

					{/* Materias */}
					{materiaResults.length > 0 && (
						<>
							<Text style={styles.resultsTitle}>Materias</Text>
							{materiaResults.map((item) => (
								<View
									key={item.id || item._id}
									style={{ paddingVertical: 6 }}
								>
									<Text style={{ fontWeight: 'bold' }}>
										{item.nombre}
									</Text>
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