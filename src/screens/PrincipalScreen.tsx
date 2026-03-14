import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Pressable,
	TextInput,
	ActivityIndicator,
	ScrollView,
	Image,
	useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../styles/global';
import { styles } from '../styles/PrincipalScreenStyles';
import {
	authService,
	usuariosService,
	gruposService,
	materiasService,
} from '../services';
import { showToast } from '../utils/toast';

type RootStackParamList = {
	Principal: undefined;
	Grupos: undefined;
	Eventos: undefined;
	Contactos: undefined;
	EditarPerfil: undefined;
	Notificaciones: undefined;
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
	const { width } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;

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
			await authService.logout();
			navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
		} catch (err: any) {
			showToast.error('Error al cerrar sesión');
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [usuariosData, gruposData, materiasData] = await Promise.all([
					usuariosService.getUsuarios(),
					gruposService.getGrupos(),
					materiasService.getMaterias(),
				]);

				setUsuarios(usuariosData);
				setGrupos(gruposData);
				setMaterias(materiasData);
			} catch (error: any) {
				console.warn(
					'[PrincipalScreen] Error cargando datos iniciales:',
					error?.message ?? error
				);
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
			const nombreMateria = normalizarTexto(g.materia?.nombre || '');

			return nombreGrupo.includes(textoBusqueda) || nombreMateria.includes(textoBusqueda);
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
		<View style={styles.container}>
			{/* HEADER */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Image
						source={require('../../assets/images/logo-caldas.png')}
						style={[styles.brandLogo, { width: logoWidth }]}
						resizeMode="contain"
					/>
				</View>

				<View style={styles.headerCenter}>
					<Pressable
						style={styles.iconButton}
						onPress={() => navigation.navigate('EditarPerfil')}
					>
						<Ionicons name="person-circle-outline" size={32} color="#007AFF" />
					</Pressable>
					<Pressable
						style={styles.iconButton}
						onPress={() => navigation.navigate('Notificaciones')}
					>
						<Ionicons name="notifications-outline" size={32} color="#007AFF" />
					</Pressable>
				</View>

				<View style={styles.headerRight}>
					{/* botón salir */}
					<Pressable style={styles.logoutButton} onPress={handleLogout}>
						<Text style={styles.logoutText}>Salir</Text>
						<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
					</Pressable>
				</View>
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
