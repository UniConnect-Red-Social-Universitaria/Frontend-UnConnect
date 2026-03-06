import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	ScrollView,
	Pressable,
	ActivityIndicator,
	Platform,
	Image,
	KeyboardAvoidingView,
} from 'react-native';

import { resolverApiBaseUrl } from '../utils/apiConfig';

import { globalStyles } from '../styles/global';
import theme from '../styles/theme';
import { useLoginStyles } from './LoginScreen.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: any) {
	const styles = useLoginStyles();

	const [hoveredButton, setHoveredButton] = useState<string | null>(null);
	const [correo, setCorreo] = useState('');
	const [contrasena, setContrasena] = useState('');
	const [estaCargando, setEstaCargando] = useState(false);

	const [errorGeneral, setErrorGeneral] = useState('');

	const [errores, setErrores] = useState({
		correo: '',
		contrasena: '',
	});

	const validarFormulario = () => {
		let nuevosErrores = { correo: '', contrasena: '' };
		let esValido = true;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!correo.trim() || !emailRegex.test(correo)) {
			nuevosErrores.correo = 'Ingresa un correo válido.';
			esValido = false;
		}

		if (contrasena.trim().length === 0) {
			nuevosErrores.contrasena = 'La contraseña es obligatoria.';
			esValido = false;
		}

		setErrores(nuevosErrores);
		return esValido;
	};

	const handleLogin = async () => {
		setErrorGeneral('');

		if (!validarFormulario()) return;

		setEstaCargando(true);

		try {
			const apiBaseUrl = resolverApiBaseUrl();
			const response = await fetch(`${apiBaseUrl}/api/usuarios/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ correo: correo.trim(), contrasena }),
			});

			const payload = await response.json();

			if (!response.ok) {
				const mensaje =
					typeof payload?.message === 'string'
						? payload.message
						: 'Correo o contraseña incorrectos, intenta de nuevo.';
				throw new Error(mensaje);
			}

			if (payload.data && payload.data.token) {
				await AsyncStorage.setItem('userToken', payload.data.token);
			} else {
				console.warn(
					"El login fue exitoso, pero el backend no devolvió un campo 'token'."
				);
			}
			navigation.reset({
				index: 0,
				routes: [{ name: 'Principal' }],
			});
		} catch (error: any) {
			console.error('Error en el login:', error);
			setErrorGeneral(
				error.message || 'Ocurrió un problema de conexión. Intenta de nuevo.'
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
						<Image
							source={require('../../assets/images/logo-caldas.png')}
							style={[globalStyles.logoImage, styles.logoPropio]}
						/>

						<Text style={styles.title}>Bienvenido de nuevo</Text>
						<Text style={styles.subtitle}>
							Inicia sesión para continuar en UniConnect
						</Text>

						<View style={styles.formContainer}>
							{/* Correo */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Correo electrónico</Text>
								<TextInput
									style={[
										styles.input,
										errores.correo ? { borderColor: 'red', borderWidth: 1 } : null,
									]}
									placeholder="ejemplo@correo.com"
									placeholderTextColor={theme.colors.primaryMid}
									keyboardType="email-address"
									autoCapitalize="none"
									value={correo}
									onChangeText={(text) => {
										setCorreo(text);
										setErrores({ ...errores, correo: '' });
										setErrorGeneral('');
									}}
									editable={!estaCargando}
								/>
								{errores.correo ? (
									<Text style={styles.errorText}>{errores.correo}</Text>
								) : null}
							</View>

							{/* Contraseña */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Contraseña</Text>
								<TextInput
									style={[
										styles.input,
										errores.contrasena ? { borderColor: 'red', borderWidth: 1 } : null,
									]}
									placeholder="Ingresa tu contraseña"
									placeholderTextColor={theme.colors.primaryMid}
									secureTextEntry
									value={contrasena}
									onChangeText={(text) => {
										setContrasena(text);
										setErrores({ ...errores, contrasena: '' });
										setErrorGeneral('');
									}}
									editable={!estaCargando}
								/>
								{errores.contrasena ? (
									<Text style={styles.errorText}>{errores.contrasena}</Text>
								) : null}
							</View>
						</View>

						{errorGeneral ? (
							<View style={styles.errorGeneralContainer}>
								<Text style={styles.errorGeneralText}>{errorGeneral}</Text>
							</View>
						) : null}

						{/* Botones y Enlaces */}
						<View style={styles.buttonsContainer}>
							<Pressable
								style={[
									styles.button,
									styles.buttonPrimary,
									hoveredButton === 'login' && !estaCargando && styles.buttonPrimaryHover,
									estaCargando && { opacity: 0.7 },
								]}
								onPress={handleLogin}
								onPressIn={() => setHoveredButton('login')}
								onPressOut={() => setHoveredButton(null)}
								disabled={estaCargando}
							>
								{estaCargando ? (
									<ActivityIndicator color={theme.colors.white} />
								) : (
									<Text style={styles.buttonPrimaryText}>Iniciar Sesión</Text>
								)}
							</Pressable>

							<Pressable
								style={[styles.button, styles.buttonSecondary]}
								onPress={() => !estaCargando && navigation.navigate('Registro')}
								onPressIn={() => setHoveredButton('registro')}
								onPressOut={() => setHoveredButton(null)}
								disabled={estaCargando}
							>
								<Text
									style={[
										styles.buttonSecondaryText,
										hoveredButton === 'registro' &&
											!estaCargando && {
												textDecorationLine: 'underline',
											},
									]}
								>
									¿No tienes una cuenta? Regístrate aquí
								</Text>
							</Pressable>
						</View>
					</View>
				</ScrollView>
			</View>
		</KeyboardAvoidingView>
	);
}
