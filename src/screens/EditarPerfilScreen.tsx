import React, { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { globalStyles } from '../styles/global';
import theme from '../styles/theme';
import { materiasService, usuariosService } from '../services';
import { Materia, Usuario } from '../types/api.types';
import { showToast } from '../utils/toast';

type EditarPerfilScreenNavigationProp = StackNavigationProp<
	RootStackParamList,
	'EditarPerfil'
>;

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
		padding: theme.spacing.lg,
	},
	container: {
		flex: 1,
		gap: theme.spacing.lg,
	},
	title: {
		fontSize: theme.typography.fontSize.xl,
		fontWeight: '700',
		color: theme.colors.primaryDark,
	},
	subtitle: {
		fontSize: theme.typography.fontSize.md,
		color: theme.colors.primaryMid,
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
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: theme.spacing.xl,
		gap: theme.spacing.sm,
	},
});

export default function EditarPerfilScreen({
	navigation,
}: {
	navigation: EditarPerfilScreenNavigationProp;
}) {
	const [perfil, setPerfil] = useState<Usuario | null>(null);
	const [materiasCatalogo, setMateriasCatalogo] = useState<Materia[]>([]);
	const [semestre, setSemestre] = useState('');
	const [selectedMateriasIds, setSelectedMateriasIds] = useState<string[]>([]);
	const [cargando, setCargando] = useState(true);
	const [guardando, setGuardando] = useState(false);
	const [errores, setErrores] = useState({
		semestre: '',
		materias: '',
	});

	const cargarPerfilAcademico = useCallback(async () => {
		setCargando(true);
		try {
			const [perfilData, materiasData] = await Promise.all([
				usuariosService.getPerfil(),
				materiasService.getMaterias(),
			]);

			setPerfil(perfilData);
			setSemestre(perfilData.semestre ? String(perfilData.semestre) : '');
			setSelectedMateriasIds((perfilData.materiasCursando || []).map(String));
			setMateriasCatalogo(materiasData || []);
		} catch (error: any) {
			showToast.error(error?.message || 'No se pudo cargar el perfil académico');
		} finally {
			setCargando(false);
		}
	}, []);

	useEffect(() => {
		void cargarPerfilAcademico();
	}, [cargarPerfilAcademico]);

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
				materiasCursando: selectedMateriasIds,
			};

			const response = await usuariosService.updatePerfil(payload);

			if (!response.success) {
				showToast.error(response.message || 'No se pudieron guardar los cambios');
				return;
			}

			showToast.success('Tu perfil académico se actualizó correctamente.');
			await cargarPerfilAcademico();
		} catch (error: any) {
			showToast.error(error?.message || 'No se pudieron guardar los cambios');
		} finally {
			setGuardando(false);
		}
	};

	if (cargando) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={styles.hint}>Cargando perfil académico...</Text>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={globalStyles.safeArea}>
				<ScrollView contentContainerStyle={styles.scrollContainer}>
					<View style={styles.container}>
						<View>
							<Text style={styles.title}>Editar perfil académico</Text>
							<Text style={styles.subtitle}>
								Actualiza tu semestre y las materias que estás cursando.
							</Text>
						</View>

						<View style={styles.card}>
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Carrera</Text>
								<TextInput
									style={[styles.input, styles.inputDisabled]}
									value={perfil?.carrera || 'No registrada'}
									editable={false}
								/>
								<Text style={styles.hint}>La carrera no puede editarse desde esta pantalla.</Text>
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
								{errores.semestre ? <Text style={styles.errorText}>{errores.semestre}</Text> : null}
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
										setSelectedMateriasIds(items);
										setErrores((prev) => ({ ...prev, materias: '' }));
									}}
									selectedStyle={{ backgroundColor: theme.colors.goldLight }}
									disable={guardando}
								/>
								{errores.materias ? (
									<Text style={styles.errorText}>{errores.materias}</Text>
								) : (
									<Text style={styles.hint}>Debes mantener al menos una materia seleccionada.</Text>
								)}
							</View>
						</View>

						<View style={styles.buttonRow}>
							<Pressable
								style={[styles.button, styles.buttonPrimary, guardando && { opacity: 0.7 }]}
								onPress={handleGuardarCambios}
								disabled={guardando}
							>
								{guardando ? (
									<ActivityIndicator size="small" color={theme.colors.white} />
								) : (
									<Text style={styles.buttonPrimaryText}>Guardar cambios</Text>
								)}
							</Pressable>

							<Pressable
								style={[styles.button, styles.buttonSecondary]}
								onPress={() => navigation.goBack()}
								disabled={guardando}
							>
								<Text style={styles.buttonSecondaryText}>Volver</Text>
							</Pressable>
						</View>
					</View>
				</ScrollView>
			</View>
		</KeyboardAvoidingView>
	);
}
