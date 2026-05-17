import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	View,
	Pressable,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootNavigator';
import { usuariosService } from '../services';
import type { PerfilEnriquecido, Insignia } from '../types/api.types';
import theme from '../styles/theme';

type Props = {
	navigation: StackNavigationProp<RootStackParamList, 'PerfilEstudiante'>;
	route: RouteProp<RootStackParamList, 'PerfilEstudiante'>;
};

const INSIGNIA_INFO: Record<Insignia, { emoji: string; label: string; desc: string; color: string }> = {
	'fundador': { emoji: '🏆', label: 'Fundador', desc: 'Ha creado grupos de estudio', color: '#f59e0b' },
	'participante-activo': { emoji: '⭐', label: 'Participante Activo', desc: 'Participa en 3 o más grupos', color: '#3b82f6' },
	'comunicador': { emoji: '💬', label: 'Comunicador', desc: 'Ha enviado 10 o más mensajes', color: '#10b981' },
	'colaborador': { emoji: '🤝', label: 'Colaborador', desc: 'Activo en grupos y mensajes', color: '#8b5cf6' },
};

export default function PerfilEstudianteScreen({ navigation, route }: Props) {
	const { usuarioId } = route.params;
	const [perfil, setPerfil] = useState<PerfilEnriquecido | null>(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');
	const [expandido, setExpandido] = useState(false);

	useEffect(() => {
		usuariosService.getPerfilEnriquecido(usuarioId)
			.then(setPerfil)
			.catch((e: Error) => setError(e.message || 'No se pudo cargar el perfil'))
			.finally(() => setCargando(false));
	}, [usuarioId]);

	const iniciales = perfil
		? `${perfil.nombre.charAt(0)}${perfil.apellido.charAt(0)}`.toUpperCase()
		: '?';

	return (
		<View style={s.container}>
			{/* Header */}
			<View style={s.header}>
				<Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
					<Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
				</Pressable>
				<Text style={s.headerTitle}>Perfil</Text>
			</View>

			{cargando && (
				<View style={s.centered}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
				</View>
			)}

			{!cargando && error !== '' && (
				<View style={s.centered}>
					<Text style={s.errorText}>{error}</Text>
				</View>
			)}

			{!cargando && perfil && (
				<ScrollView contentContainerStyle={s.scroll}>
					{/* Hero */}
					<View style={s.hero}>
						<View style={s.avatar}>
							<Text style={s.avatarText}>{iniciales}</Text>
						</View>
						<Text style={s.name}>{perfil.nombre} {perfil.apellido}</Text>
						<Text style={s.carrera}>{perfil.carrera}</Text>
						{perfil.semestre && (
							<Text style={s.semestre}>Semestre {perfil.semestre}</Text>
						)}
						
						{/* Botón Ver Más */}
						<Pressable 
							style={s.verMasBtn}
							onPress={() => setExpandido(!expandido)}
						>
							<Text style={s.verMasText}>
								{expandido ? 'Ver Menos' : 'Ver Más'}
							</Text>
							<Ionicons 
								name={expandido ? 'chevron-up' : 'chevron-down'} 
								size={20} 
								color="#fff" 
							/>
						</Pressable>
					</View>

					{/* Estadísticas */}
					{expandido && (
						<View style={s.section}>
							<Text style={s.sectionTitle}>ESTADÍSTICAS</Text>
							<View style={s.statsRow}>
								<View style={s.statBox}>
									<Text style={s.statNum}>{perfil.estadisticas.gruposCreados}</Text>
									<Text style={s.statLabel}>Grupos{'\n'}creados</Text>
								</View>
								<View style={s.statBox}>
									<Text style={s.statNum}>{perfil.estadisticas.gruposParticipa}</Text>
									<Text style={s.statLabel}>Grupos en{'\n'}los que participa</Text>
								</View>
								<View style={s.statBox}>
									<Text style={s.statNum}>{perfil.estadisticas.mensajesEnviados}</Text>
									<Text style={s.statLabel}>Mensajes{'\n'}enviados</Text>
								</View>
							</View>
						</View>
					)}

					{/* Insignias */}
					{expandido && (
						<View style={s.section}>
							<Text style={s.sectionTitle}>INSIGNIAS</Text>
							{perfil.insignias.length === 0 ? (
								<Text style={s.emptyText}>Aún no ha obtenido insignias.</Text>
							) : (
								perfil.insignias.map((insignia) => {
									const info = INSIGNIA_INFO[insignia];
									return (
										<View
											key={insignia}
											style={[s.badge, { borderColor: info.color + '55', backgroundColor: info.color + '18' }]}
										>
											<Text style={s.badgeEmoji}>{info.emoji}</Text>
											<View style={s.badgeInfo}>
												<Text style={[s.badgeLabel, { color: info.color }]}>{info.label}</Text>
												<Text style={[s.badgeDesc, { color: info.color }]}>{info.desc}</Text>
											</View>
										</View>
									);
								})
							)}
						</View>
					)}

					{/* Materias */}
					{perfil.asignaturasActivas.length > 0 && (
						<View style={s.section}>
							<Text style={s.sectionTitle}>MATERIAS QUE CURSA</Text>
							<View style={s.materiasWrap}>
								{perfil.asignaturasActivas.map((m, i) => (
									<View key={i} style={s.materiaChip}>
										<Text style={s.materiaText}>{m}</Text>
									</View>
								))}
							</View>
						</View>
					)}
				</ScrollView>
			)}
		</View>
	);
}

const s = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f5f5f5' },
	header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
	backBtn: { marginRight: 12 },
	headerTitle: { fontSize: 17, fontWeight: '600', color: '#00284d' },
	centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
	errorText: { color: '#e74c3c', fontSize: 15, textAlign: 'center' },
	scroll: { padding: 16, gap: 16 },
	hero: { backgroundColor: theme.colors.primary, borderRadius: 16, padding: 28, alignItems: 'center' },
	avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
	avatarText: { fontSize: 26, fontWeight: '700', color: '#fff' },
	name: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
	carrera: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
	semestre: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
	section: { backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#e8eef4' },
	sectionTitle: { fontSize: 11, fontWeight: '700', color: '#7a9ab5', letterSpacing: 1, marginBottom: 14 },
	statsRow: { flexDirection: 'row', gap: 10 },
	statBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e8eef4' },
	statNum: { fontSize: 26, fontWeight: '700', color: theme.colors.primary },
	statLabel: { fontSize: 11, color: '#7a9ab5', fontWeight: '500', textAlign: 'center', marginTop: 4 },
	emptyText: { color: '#aab', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
	badge: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
	badgeEmoji: { fontSize: 24 },
	badgeInfo: { flex: 1 },
	badgeLabel: { fontSize: 14, fontWeight: '700' },
	badgeDesc: { fontSize: 12, marginTop: 2, opacity: 0.8 },
	materiasWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	materiaChip: { backgroundColor: '#eef2f6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
	materiaText: { fontSize: 13, fontWeight: '500', color: theme.colors.primary },
	verMasBtn: { 
		flexDirection: 'row', 
		alignItems: 'center', 
		justifyContent: 'center',
		gap: 6,
		marginTop: 14, 
		paddingVertical: 8, 
		paddingHorizontal: 16,
		backgroundColor: 'rgba(255,255,255,0.2)',
		borderRadius: 20,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.3)',
	},
	verMasText: { 
		color: '#fff', 
		fontSize: 13, 
		fontWeight: '600',
	},
});
