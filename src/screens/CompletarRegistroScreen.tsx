import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	ScrollView,
	Pressable,
	ActivityIndicator,
	Platform,
	KeyboardAvoidingView,
} from 'react-native';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import { showToast } from '../utils/toast';

import { globalStyles } from '../styles/global';
import theme from '../styles/theme';
import { useCompletarRegistroStyles } from '../styles/CompletarRegistroScreen.styles';
import { authService, onboardingService } from '../services';
import { apiClient } from '../services';
import { Carrera, MateriaCatalogo } from '../types/api.types';

export default function CompletarRegistroScreen({ navigation, route }: any) {
	const styles = useCompletarRegistroStyles();
	const { googleData } = route.params || {};

	const [hoveredButton, setHoveredButton] = useState<string | null>(null);
	const [contrasena, setContrasena] = useState('');
	const [selectedCarreraId, setSelectedCarreraId] = useState<string | null>(null);
	const [semestre, setSemestre] = useState('');
	const [selectedMateriasIds, setSelectedMateriasIds] = useState<string[]>([]);

	const [carrerasList, setCarrerasList] = useState<Carrera[]>([]);
	const [materiasList, setMateriasList] = useState<MateriaCatalogo[]>([]);

	const [estaCargando, setEstaCargando] = useState(false);
	const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

	const [errores, setErrores] = useState({
		contrasena: '',
		carrera: '',
		semestre: '',
		materias: '',
	});

	useEffect(() => {
		const cargarCatalogos = async () => {
			try {
				// Primero intentar poblar el catálogo si está vacío
				try {
					console.log('Intentando poblar catálogo...');
					await apiClient.post('/api/catalogos/poblar');
				} catch (error: any) {
					console.log('Poblar catálogo falló o ya está poblado:', error.message);
				}

				const response = await apiClient.get<{ carreras: Carrera[]; materias: MateriaCatalogo[] }>('/api/catalogos');
				console.log('Respuesta del endpoint /api/catalogos:', response);
				if (response.success && response.data) {
					console.log('Carreras cargadas:', response.data.carreras);
					console.log('Materias cargadas:', response.data.materias);
					setCarrerasList(response.data.carreras);
					setMateriasList(response.data.materias);
				} else {
					showToast.error('Error al cargar los catálogos');
				}
			} catch (error: any) {
				console.error('Error completo al cargar catálogos:', error);
				showToast.error(error.message || 'Error al cargar los catálogos');
			} finally {
				setCargandoCatalogos(false);
			}
		};

		cargarCatalogos();
	}, []);

	const validarFormulario = () => {
		let nuevosErrores = {
			contrasena: '',
			carrera: '',
			semestre: '',
			materias: '',
		};
		let esValido = true;

		if (contrasena.trim().length < 8) {
			nuevosErrores.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
			esValido = false;
		}
		if (!selectedCarreraId) {
			nuevosErrores.carrera = 'La carrera es obligatoria.';
			esValido = false;
		}
		const semestreNum = parseInt(semestre);
		if (!semestre.trim() || isNaN(semestreNum) || semestreNum < 1 || semestreNum > 20) {
			nuevosErrores.semestre = 'Ingresa un número de semestre válido.';
			esValido = false;
		}
		if (selectedMateriasIds.length === 0) {
			nuevosErrores.materias = 'Debes seleccionar al menos una materia.';
			esValido = false;
		}

		setErrores(nuevosErrores);
		return esValido;
	};

	const handleFinalizarRegistro = async () => {
		if (!validarFormulario()) return;

		const datosCompletos = {
			nombre: googleData?.nombre || '',
			apellido: googleData?.apellido || '',
			correo: googleData?.correo || '',
			googleIdToken: googleData?.googleIdToken || '',
			contrasena: contrasena,
			carrera: selectedCarreraId!, // Enviar como string
			semestre: parseInt(semestre),
			materiasCursando: selectedMateriasIds, // Enviar como array de strings
		};

		console.log('Datos a enviar:', datosCompletos);

		setEstaCargando(true);

		try {
			console.log('Enviando datos al backend...');
			const registroResponse = await authService.registro(datosCompletos);
			console.log('Respuesta del registro:', registroResponse);

			// Verificar si la respuesta indica error
			if (!registroResponse.success) {
				console.error('Error en registro:', registroResponse.message);
				showToast.error(registroResponse.message || 'Error en el registro');
				return;
			}

			showToast.success(
				'¡Bienvenido a UniConnect! Tu cuenta ha sido creada exitosamente.'
			);
			await onboardingService.markPrincipalOnboardingPending();

			setTimeout(() => {
				navigation.reset({
					index: 0,
					routes: [{ name: 'Principal' }],
				});
			}, 2000);
		} catch (error: any) {
			showToast.error(error.message || 'Ocurrió un problema de conexión.');
		} finally {
			setEstaCargando(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
		>
			<View style={globalStyles.safeArea}>
				<ScrollView
					contentContainerStyle={styles.scrollContainer}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.container}>
						<Text style={styles.title}>Completa tu perfil</Text>
						<Text style={styles.subtitle}>
							Necesitamos algunos datos académicos para terminar tu registro en
							UniConnect.
						</Text>

						<View style={styles.formContainer}>
							{/* Contraseña */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Contraseña</Text>
								<TextInput
									style={[
										styles.input,
										errores.contrasena ? { borderColor: 'red', borderWidth: 1 } : null,
									]}
									placeholder="Mínimo 8 caracteres"
									placeholderTextColor={theme.colors.primaryMid}
									secureTextEntry
									value={contrasena}
									onChangeText={(text) => {
										setContrasena(text);
										setErrores({ ...errores, contrasena: '' });
									}}
									editable={!estaCargando}
								/>
								{errores.contrasena ? (
									<Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
										{errores.contrasena}
									</Text>
								) : null}
							</View>

							{/* Carrera */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Carrera</Text>
								<Dropdown
									style={[
										styles.input,
										errores.carrera ? { borderColor: 'red', borderWidth: 1 } : null,
									]}
									placeholder="Selecciona tu carrera"
									placeholderStyle={{ color: theme.colors.primaryMid }}
									selectedTextStyle={{ color: theme.colors.primaryDark }}
									inputSearchStyle={{ color: theme.colors.primaryDark }}
									data={carrerasList.map(c => ({ label: c.nombre, value: c.id.toString() }))}
									search
									searchPlaceholder="Buscar carrera..."
									labelField="label"
									valueField="value"
									value={selectedCarreraId}
									onChange={(item) => {
										setSelectedCarreraId(item.value);
										setErrores({ ...errores, carrera: '' });
									}}
									disable={estaCargando || cargandoCatalogos}
								/>
								{errores.carrera ? (
									<Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
										{errores.carrera}
									</Text>
								) : null}
							</View>

							{/* Semestre */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Semestre actual</Text>
								<TextInput
									style={[
										styles.input,
										errores.semestre ? { borderColor: 'red', borderWidth: 1 } : null,
									]}
									placeholder="Ej. 5"
									placeholderTextColor={theme.colors.primaryMid}
									keyboardType="numeric"
									value={semestre}
									onChangeText={(text) => {
										setSemestre(text);
										setErrores({ ...errores, semestre: '' });
									}}
									editable={!estaCargando}
								/>
								{errores.semestre ? (
									<Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
										{errores.semestre}
									</Text>
								) : null}
							</View>

							{/* Materias */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Materias que estás cursando</Text>
								<MultiSelect
									style={[
										styles.input,
										errores.materias ? { borderColor: 'red', borderWidth: 1 } : null,
									]}
									placeholder="Selecciona tus materias"
									placeholderStyle={{ color: theme.colors.primaryMid }}
									selectedTextStyle={{ color: theme.colors.primaryDark }}
									inputSearchStyle={{ color: theme.colors.primaryDark }}
									data={materiasList.map(m => ({ label: m.nombre, value: m.id.toString() }))}
									search
									searchPlaceholder="Buscar materia..."
									labelField="label"
									valueField="value"
									value={selectedMateriasIds}
									onChange={(items) => {
										setSelectedMateriasIds(items);
										setErrores({ ...errores, materias: '' });
									}}
									selectedStyle={{ backgroundColor: theme.colors.goldLight }}
									disable={estaCargando || cargandoCatalogos}
								/>
								{errores.materias ? (
									<Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
										{errores.materias}
									</Text>
								) : (
									<Text style={styles.inputHint}>Puedes seleccionar múltiples materias</Text>
								)}
							</View>
						</View>

						{/* Botones */}
						<View style={styles.buttonsContainer}>
							<Pressable
								style={[
									styles.button,
									styles.buttonPrimary,
									hoveredButton === 'finalizar' &&
										!estaCargando &&
										styles.buttonPrimaryHover,
									estaCargando && { opacity: 0.7 },
								]}
								onPress={handleFinalizarRegistro}
								onPressIn={() => setHoveredButton('finalizar')}
								onPressOut={() => setHoveredButton(null)}
								disabled={estaCargando}
							>
								{estaCargando ? (
									<ActivityIndicator color={theme.colors.white} />
								) : (
									<Text style={styles.buttonPrimaryText}>Finalizar Registro</Text>
								)}
							</Pressable>

							<Pressable
								style={[styles.button, styles.buttonSecondary]}
								onPress={() => !estaCargando && navigation.goBack()}
								onPressIn={() => setHoveredButton('volver')}
								onPressOut={() => setHoveredButton(null)}
								disabled={estaCargando}
							>
								<Text
									style={[
										styles.buttonSecondaryText,
										hoveredButton === 'volver' &&
											!estaCargando && {
												textDecorationLine: 'underline',
											},
									]}
								>
									Volver
								</Text>
							</Pressable>
						</View>
					</View>
				</ScrollView>
			</View>
		</KeyboardAvoidingView>
	);
}
