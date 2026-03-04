import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	ScrollView,
	Pressable,
	Alert,
	ActivityIndicator,
	Platform,
	KeyboardAvoidingView,
} from 'react-native';

import { resolverApiBaseUrl } from '../utils/apiConfig';

import { globalStyles } from '../styles/global';
import theme from '../styles/theme';
import { useCompletarRegistroStyles } from './CompletarRegistroScreen.styles';

export default function CompletarRegistroScreen({ navigation, route }: any) {
	const styles = useCompletarRegistroStyles();
	const { googleData } = route.params || {};

	const [hoveredButton, setHoveredButton] = useState<string | null>(null);
	const [contrasena, setContrasena] = useState('');
	const [carrera, setCarrera] = useState('');
	const [semestre, setSemestre] = useState('');
	const [materias, setMaterias] = useState('');

	const [estaCargando, setEstaCargando] = useState(false);

	const [errores, setErrores] = useState({
		contrasena: '',
		carrera: '',
		semestre: '',
		materias: '',
	});

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
		if (carrera.trim() === '') {
			nuevosErrores.carrera = 'La carrera es obligatoria.';
			esValido = false;
		}
		const semestreNum = parseInt(semestre);
		if (!semestre.trim() || isNaN(semestreNum) || semestreNum < 1 || semestreNum > 20) {
			nuevosErrores.semestre = 'Ingresa un número de semestre válido.';
			esValido = false;
		}
		if (materias.trim() === '') {
			nuevosErrores.materias = 'Debes ingresar al menos una materia.';
			esValido = false;
		}

		setErrores(nuevosErrores);
		return esValido;
	};

	const handleFinalizarRegistro = async () => {
		if (!validarFormulario()) return;

		const materiasArray = materias
			.split(',')
			.map((m) => m.trim())
			.filter((m) => m !== '');

		const datosCompletos = {
			nombre: googleData?.nombre || '',
			apellido: googleData?.apellido || '',
			correo: googleData?.correo || '',
			googleIdToken: googleData?.googleIdToken || '',
			contrasena: contrasena,
			carrera: carrera,
			semestre: parseInt(semestre),
			materiasCursando: materiasArray,
		};

		setEstaCargando(true);

		try {
			const apiBaseUrl = resolverApiBaseUrl();
			console.log(`Enviando registro a: ${apiBaseUrl}/api/usuarios/registro`);

			const response = await fetch(`${apiBaseUrl}/api/usuarios/registro`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(datosCompletos),
			});

			const payload = await response.json();

			if (!response.ok) {
				const mensaje =
					typeof payload?.message === 'string'
						? payload.message
						: `HTTP Error ${response.status}`;
				throw new Error(mensaje);
			}

			if (Platform.OS === 'web') {
				navigation.reset({
					index: 0,
					routes: [{ name: 'Principal' }],
				});
			} else {
				Alert.alert(
					'¡Bienvenido a UniConnect!',
					'Tu cuenta ha sido creada exitosamente.',
					[
						{
							text: 'OK',
							onPress: () => {
								navigation.reset({
									index: 0,
									routes: [{ name: 'Principal' }],
								});
							},
						},
					]
				);
			}
		} catch (error: any) {
			console.error('Error en el registro:', error);
			Alert.alert(
				'Error al registrar',
				error.message || 'Ocurrió un problema de conexión.'
			);
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
								<TextInput
									style={[
										styles.input,
										errores.carrera ? { borderColor: 'red', borderWidth: 1 } : null,
									]}
									placeholder="Ej. Ingeniería de Sistemas"
									placeholderTextColor={theme.colors.primaryMid}
									value={carrera}
									onChangeText={(text) => {
										setCarrera(text);
										setErrores({ ...errores, carrera: '' });
									}}
									editable={!estaCargando}
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
								<TextInput
									style={[
										styles.input,
										errores.materias ? { borderColor: 'red', borderWidth: 1 } : null,
									]}
									placeholder="Ej. Cálculo, Programación II"
									placeholderTextColor={theme.colors.primaryMid}
									value={materias}
									onChangeText={(text) => {
										setMaterias(text);
										setErrores({ ...errores, materias: '' });
									}}
									editable={!estaCargando}
								/>
								{errores.materias ? (
									<Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
										{errores.materias}
									</Text>
								) : (
									<Text style={styles.inputHint}>Separa cada materia con una coma</Text>
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
