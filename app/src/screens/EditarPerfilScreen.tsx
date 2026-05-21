import React, { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
	Text as RNText,
	Pressable,
	Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, Screen, SecondaryButton, Text, Title } from '@uniconnect/ui';
import { MultiSelect } from 'react-native-element-dropdown';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { globalStyles } from '../styles/global';
import theme from '../styles/theme';
import { materiasService, usuariosService, authService } from '../services';
import { Materia, Usuario, PerfilEnriquecido, Insignia } from '../types/api.types';
import { showToast } from '../utils/toast';
import {
	getPreferenciasNotificaciones,
	getDefaultPreferencias,
	PreferenciaNotificacion,
	CANALES,
	type CanalNotificacion,
	type TipoEvento,
	updatePreferenciasGlobales,
	TIPO_EVENTO_LABELS,
} from '../services/notificaciones-preferencias.service';

type EditarPerfilScreenNavigationProp = StackNavigationProp<
	RootStackParamList,
	'EditarPerfil'
>;

const INSIGNIA_INFO: Record<Insignia, { emoji: string; label: string; desc: string; color: string }> = {
	'fundador': { emoji: '🏆', label: 'Fundador', desc: 'Ha creado grupos de estudio', color: '#f59e0b' },
	'participante-activo': { emoji: '⭐', label: 'Participante Activo', desc: 'Participa en 3 o más grupos', color: '#3b82f6' },
	'comunicador': { emoji: '💬', label: 'Comunicador', desc: 'Ha enviado 10 o más mensajes', color: '#10b981' },
	'colaborador': { emoji: '🤝', label: 'Colaborador', desc: 'Activo en grupos y mensajes', color: '#8b5cf6' },
};

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
		padding: theme.spacing.lg,
		justifyContent: 'center',
	},
	container: {
		gap: theme.spacing.lg,
		maxWidth: 480,
		width: '100%',
		alignSelf: 'center',
	},
	header: {
		alignItems: 'center',
		gap: theme.spacing.xs,
	},
	title: {
		fontSize: theme.typography.fontSize.xl,
		fontWeight: '700',
		color: theme.colors.primaryDark,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: theme.typography.fontSize.md,
		color: theme.colors.primaryMid,
		textAlign: 'center',
	},
	card: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.radius.md,
		padding: theme.spacing.md,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		gap: theme.spacing.md,
	},
	inputGroup: {
		gap: theme.spacing.xs,
	},
	label: {
		fontSize: theme.typography.fontSize.sm,
		fontWeight: '600',
		color: theme.colors.primaryDark,
	},
	input: {
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: theme.radius.md,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		fontSize: theme.typography.fontSize.md,
		color: theme.colors.primaryDark,
		backgroundColor: theme.colors.white,
	},
	inputDisabled: {
		backgroundColor: '#f3f4f6',
		color: '#6b7280',
	},
	errorInput: {
		borderColor: '#dc2626',
	},
	errorText: {
		fontSize: theme.typography.fontSize.xs,
		color: '#dc2626',
	},
	hint: {
		fontSize: theme.typography.fontSize.xs,
		color: theme.colors.primaryMid,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	button: {
		flex: 1,
		borderRadius: theme.radius.md,
		paddingVertical: theme.spacing.sm + 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonPrimary: {
		backgroundColor: theme.colors.primary,
	},
	buttonSecondary: {
		backgroundColor: theme.colors.white,
		borderWidth: 1,
		borderColor: '#cbd5e1',
	},
	buttonPrimaryText: {
		color: theme.colors.white,
		fontWeight: '700',
	},
	buttonSecondaryText: {
		color: theme.colors.primaryDark,
		fontWeight: '600',
	},
	verMasBtn: { 
		flexDirection: 'row', 
		alignItems: 'center', 
		justifyContent: 'center',
		gap: 6,
		marginTop: 14, 
		paddingVertical: 8, 
		paddingHorizontal: 16,
		backgroundColor: theme.colors.primary,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: theme.colors.primary,
	},
	verMasText: { 
		color: '#fff', 
		fontSize: 13, 
		fontWeight: '600',
	},
	section: { 
		backgroundColor: '#fff', 
		borderRadius: 14, 
		padding: 18, 
		borderWidth: 1, 
		borderColor: '#e8eef4',
		marginTop: 16,
	},
	sectionTitle: { 
		fontSize: 11, 
		fontWeight: '700', 
		color: '#7a9ab5', 
		letterSpacing: 1, 
		marginBottom: 14,
		textTransform: 'uppercase',
	},
	statsRow: { 
		flexDirection: 'row', 
		gap: 10,
	},
	statBox: { 
		flex: 1, 
		backgroundColor: '#f8fafc', 
		borderRadius: 10, 
		padding: 14, 
		alignItems: 'center', 
		borderWidth: 1, 
		borderColor: '#e8eef4',
	},
	statNum: { 
		fontSize: 26, 
		fontWeight: '700', 
		color: theme.colors.primary,
	},
	statLabel: { 
		fontSize: 11, 
		color: '#7a9ab5', 
		fontWeight: '500', 
		textAlign: 'center', 
		marginTop: 4,
	},
	badge: { 
		flexDirection: 'row', 
		alignItems: 'center', 
		gap: 14, 
		padding: 14, 
		borderRadius: 12, 
		borderWidth: 1.5, 
		marginBottom: 8,
	},
	badgeEmoji: { 
		fontSize: 24,
	},
	badgeInfo: { 
		flex: 1,
	},
	badgeLabel: { 
		fontSize: 14, 
		fontWeight: '700',
	},
	badgeDesc: { 
		fontSize: 12, 
		marginTop: 2, 
		opacity: 0.8,
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: theme.spacing.xl,
		gap: theme.spacing.sm,
	},
	notificacionesSection: {
		backgroundColor: '#fff',
		borderRadius: 14,
		padding: 18,
		borderWidth: 1,
		borderColor: '#e8eef4',
		marginTop: 16,
	},
	notificacionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f4f8',
	},
	notificacionRowLast: {
		borderBottomWidth: 0,
	},
	notificacionContent: {
		flex: 1,
		marginRight: 12,
	},
	notificacionLabel: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.primaryDark,
		marginBottom: 4,
	},
	notificacionEmoji: {
		fontSize: 18,
		marginRight: 8,
	},
});

export default function EditarPerfilScreen({
	navigation,
}: {
	navigation: EditarPerfilScreenNavigationProp;
}) {
	const [nombre, setNombre] = useState('');
	const [materiasCatalogo, setMateriasCatalogo] = useState<Materia[]>([]);
	const [semestre, setSemestre] = useState('');
	const [selectedMateriasIds, setSelectedMateriasIds] = useState<string[]>([]);
	const [cargando, setCargando] = useState(true);
	const [guardando, setGuardando] = useState(false);
	const [expandido, setExpandido] = useState(false);
	const [perfil, setPerfil] = useState<PerfilEnriquecido | null>(null);
	const [preferenciasNotificaciones, setPreferenciasNotificaciones] = useState<
		Record<CanalNotificacion, boolean>
	>({ 'in-app': true, 'email': false, 'push': false });
	const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false);
	const [errores, setErrores] = useState({
		semestre: '',
		materias: '',
	});

	const cargarPerfilAcademico = useCallback(async () => {
		setCargando(true);
		try {
			const usuarioId = await authService.obtenerIdUsuarioActual();
			const [perfilData, materiasData, perfilEnriquecido] = await Promise.all([
				usuariosService.getPerfil(),
				materiasService.getMaterias(),
				usuarioId ? usuariosService.getPerfilEnriquecido(usuarioId) : Promise.resolve(null),
			]);

			setNombre(`${perfilData.nombre || ''} ${perfilData.apellido || ''}`.trim());
			setSemestre(perfilData.semestre ? String(perfilData.semestre) : '');
			setPerfil(perfilEnriquecido || null);

			// Resolver nombres→IDs usando el catálogo y eliminar duplicados
			const catalogoIds = new Set((materiasData || []).map((m) => String(m.id)));
			const idsResueltos = [
				...new Set(
					(perfilData.materiasCursando || [])
						.map((item) => {
							const asString = String(item);
							if (catalogoIds.has(asString)) return asString;
							const match = (materiasData || []).find((m) => m.nombre === asString);
							return match ? String(match.id) : null;
						})
						.filter((id): id is string => id !== null)
				),
			];
			setSelectedMateriasIds(idsResueltos);
			setMateriasCatalogo(materiasData || []);
		} catch (error) {
            const errMsg = error instanceof Error ? error.message : 'No se pudo cargar el perfil académico';
            showToast.error(errMsg);
        } finally {
            setCargando(false);
        }
    }, []);

	const cargarPreferenciasNotificaciones = useCallback(async () => {
    setCargandoNotificaciones(true);
    try {
        // 1. Forzamos que la respuesta sea del tipo correcto
        const preferencias: PreferenciaNotificacion[] = await getPreferenciasNotificaciones();
        
        // 2. Si viene vacío, usamos los defaults tipados
        const listaPreferencias: PreferenciaNotificacion[] = preferencias.length > 0 
            ? preferencias 
            : getDefaultPreferencias();

        const canalMap: Record<CanalNotificacion, boolean> = {
            'in-app': false,
            'email': false,
            'push': false,
        };
        
        // 3. Tipamos explícitamente el parámetro 'p' como PreferenciaNotificacion
        const prefMensaje = listaPreferencias.find(
            (p: PreferenciaNotificacion) => p.tipoEvento === 'mensaje'
        );

        if (prefMensaje) {
            // 4. Tipamos explícitamente 'canal' como CanalNotificacion
            prefMensaje.canales.forEach((canal: CanalNotificacion) => {
                if (canal in canalMap) {
                    canalMap[canal] = true;
                }
            });
        }
        
        setPreferenciasNotificaciones(canalMap);
    } catch (error) {
        console.log('❌ Error al procesar las preferencias en la pantalla:', error);
    } finally {
        setCargandoNotificaciones(false);
    }
}, []);

	useEffect(() => {
		void cargarPerfilAcademico();
		void cargarPreferenciasNotificaciones();
	}, [cargarPerfilAcademico, cargarPreferenciasNotificaciones]);

	const validarFormulario = () => {
		const nuevosErrores = {
			semestre: '',
			materias: '',
		};

		let esValido = true;
		const semestreNumero = Number(semestre);

		if (!semestre.trim() || !Number.isInteger(semestreNumero) || semestreNumero <= 0) {
			nuevosErrores.semestre = 'Ingresa un semestre válido mayor a 0.';
			esValido = false;
		}

		if (selectedMateriasIds.length === 0) {
			nuevosErrores.materias =
				'Debes seleccionar al menos una materia para guardar cambios.';
			esValido = false;
		}

		setErrores(nuevosErrores);
		return esValido;
	};

const handleGuardarCambios = async () => {
    if (!validarFormulario()) {
        showToast.error('Debes seleccionar al menos una materia.');
        return;
    }

    setGuardando(true);
    try {
        const payload = {
            semestre: Number(semestre),
            materiasCursando: [...new Set(selectedMateriasIds)],
        };

        const canalesSeleccionados: CanalNotificacion[] = (
            Object.entries(preferenciasNotificaciones) as [CanalNotificacion, boolean][]
        )
            .filter(([_, enabled]) => enabled)
            .map(([canal]) => canal);

        const [responsePerfil] = await Promise.all([
            usuariosService.updatePerfil(payload),
            updatePreferenciasGlobales(canalesSeleccionados) // 👈 Aquí ocurre la magia
        ]);

        if (!responsePerfil.success) {
            showToast.error(responsePerfil.message || 'No se pudieron guardar los cambios');
            return;
        }

        showToast.success('Tu perfil académico y preferencias se actualizaron correctamente.');
        await cargarPerfilAcademico();
    } catch (error: any) {
        showToast.error(error?.message || 'No se pudieron guardar los cambios');
    } finally {
        setGuardando(false);
    }
};
	if (cargando) {
		return (
			<Screen style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={styles.hint}>Cargando perfil académico...</Text>
			</Screen>
		);
	}

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<Screen style={globalStyles.safeArea}>
				<ScrollView contentContainerStyle={styles.scrollContainer}>
					<View style={styles.container}>
						<View style={styles.header}>
							<Title style={styles.title}>Editar perfil académico</Title>
							<Text style={styles.subtitle}>
								Actualiza tu semestre y las materias que estás cursando.
							</Text>
						</View>

						<View style={styles.card}>
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Nombre</Text>
								<TextInput
									style={[styles.input, styles.inputDisabled]}
									value={nombre || 'No disponible'}
									editable={false}
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.label}>Semestre</Text>
								<TextInput
									style={[styles.input, errores.semestre ? styles.errorInput : null]}
									placeholder="Ej. 5"
									placeholderTextColor={theme.colors.primaryMid}
									keyboardType="numeric"
									value={semestre}
									onChangeText={(text) => {
										setSemestre(text);
										setErrores((prev) => ({ ...prev, semestre: '' }));
									}}
									editable={!guardando}
								/>
								{errores.semestre ? (
									<Text style={styles.errorText}>{errores.semestre}</Text>
								) : null}
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.label}>Materias que estás cursando</Text>
								<MultiSelect
									style={[styles.input, errores.materias ? styles.errorInput : null]}
									placeholder="Selecciona tus materias"
									placeholderStyle={{ color: theme.colors.primaryMid }}
									selectedTextStyle={{ color: theme.colors.primaryDark }}
									inputSearchStyle={{ color: theme.colors.primaryDark }}
									data={materiasCatalogo.map((m) => ({
										label: m.nombre,
										value: String(m.id),
									}))}
									search
									searchPlaceholder="Buscar materia..."
									labelField="label"
									valueField="value"
									value={selectedMateriasIds}
									onChange={(items) => {
										setSelectedMateriasIds([...new Set(items)]);
										setErrores((prev) => ({ ...prev, materias: '' }));
									}}
									selectedStyle={{ backgroundColor: theme.colors.goldLight }}
									disable={guardando}
								/>
								{errores.materias ? (
									<Text style={styles.errorText}>{errores.materias}</Text>
								) : (
									<Text style={styles.hint}>
										Debes mantener al menos una materia seleccionada.
									</Text>
								)}
							</View>

							<Pressable 
								style={styles.verMasBtn}
								onPress={() => setExpandido(!expandido)}
							>
								<Text style={styles.verMasText}>
									{expandido ? 'Ver Menos' : 'Ver Más'}
								</Text>
								<Ionicons 
									name={expandido ? 'chevron-up' : 'chevron-down'} 
									size={16} 
									color="#fff" 
								/>
							</Pressable>

							{expandido && perfil && (
								<>
									<View style={styles.section}>
										<Text style={styles.sectionTitle}>Estadísticas</Text>
										<View style={styles.statsRow}>
											<View style={styles.statBox}>
												<RNText style={styles.statNum}>
													{perfil.estadisticas?.gruposCreados || 0}
												</RNText>
												<Text style={styles.statLabel}>Grupos creados</Text>
											</View>
											<View style={styles.statBox}>
												<RNText style={styles.statNum}>
													{perfil.estadisticas?.gruposParticipa || 0}
												</RNText>
												<Text style={styles.statLabel}>Grupos activos</Text>
											</View>
											<View style={styles.statBox}>
												<RNText style={styles.statNum}>
													{perfil.estadisticas?.mensajesEnviados || 0}
												</RNText>
												<Text style={styles.statLabel}>Mensajes</Text>
											</View>
										</View>
									</View>

									{perfil.insignias && perfil.insignias.length > 0 && (
										<View style={styles.section}>
											<Text style={styles.sectionTitle}>Insignias</Text>
											{perfil.insignias.map((insignia, idx) => {
												const info = INSIGNIA_INFO[insignia];
												if (!info) return null;
												return (
													<View 
														key={idx}
														style={[
															styles.badge,
															{ borderColor: info.color, backgroundColor: `${info.color}11` }
														]}
													>
														<RNText style={styles.badgeEmoji}>{info.emoji}</RNText>
														<View style={styles.badgeInfo}>
															<RNText style={[styles.badgeLabel, { color: info.color }]}>
																{info.label}
															</RNText>
															<RNText style={[styles.badgeDesc, { color: info.color }]}>
																{info.desc}
															</RNText>
														</View>
													</View>
												);
											})}
										</View>
									)}

									<View style={styles.notificacionesSection}>
										<Text style={styles.sectionTitle}>📬 Canales de Notificaciones</Text>
										{CANALES.map((canal, idx) => (
											<View 
												key={canal.id}
												style={[
													styles.notificacionRow,
													idx === CANALES.length - 1 && styles.notificacionRowLast,
												]}
											>
												<View style={styles.notificacionContent}>
													<Text style={styles.notificacionLabel}>
														<RNText>{canal.emoji}</RNText> {canal.label}
													</Text>
												</View>
												<Switch
													value={preferenciasNotificaciones[canal.id]}
													onValueChange={(valor) => {
														setPreferenciasNotificaciones(prev => ({
															...prev,
															[canal.id]: valor,
														}));
													}}
													trackColor={{ false: '#cbd5e1', true: '#10b981' }}
													thumbColor={
														preferenciasNotificaciones[canal.id]
															? '#27ae60'
															: '#f3f4f6'
													}
													disabled={guardando || cargandoNotificaciones}
												/>
											</View>
										))}
									</View>
								</>
							)}
						</View>

						<View style={styles.buttonRow}>
							<PrimaryButton
								style={[
									styles.button,
									styles.buttonPrimary,
									guardando && { opacity: 0.7 },
								]}
								onPress={handleGuardarCambios}
								disabled={guardando}
							>
								{guardando ? (
									<ActivityIndicator size="small" color={theme.colors.white} />
								) : (
									<RNText style={styles.buttonPrimaryText}>Guardar cambios</RNText>
								)}
							</PrimaryButton>

							<SecondaryButton
								style={[styles.button, styles.buttonSecondary]}
								onPress={() => navigation.navigate('Principal')}
								disabled={guardando}
							>
								<RNText style={styles.buttonSecondaryText}>Volver</RNText>
							</SecondaryButton>
						</View>
					</View>
				</ScrollView>
			</Screen>
		</KeyboardAvoidingView>
	);
}
