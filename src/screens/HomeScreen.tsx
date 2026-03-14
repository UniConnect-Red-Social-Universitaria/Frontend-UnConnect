import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions, Image } from 'react-native';
import { useHomeScreenStyles } from '../styles/HomeScreen.styles';
import { notificacionesService } from '../services';
import { showToast } from '../utils/toast';

export default function HomeScreen({ navigation }: any) {
	const [hoveredButton, setHoveredButton] = useState<string | null>(null);
	const { width } = useWindowDimensions();

	// Determinar si es pantalla pequeña (móvil)
	const isSmallScreen = width < 768;
	const styles = useHomeScreenStyles();

	const handleRegisterPress = () => {
		navigation.navigate('Registro');
	};
	const handleLoginPress = () => {
		navigation.navigate('Login');
	};

	const handleNotificationTestPress = async () => {
		try {
			await notificacionesService.sendPushTestToCurrentUser();
			showToast.success('Notificacion de prueba enviada');
		} catch (error) {
			showToast.error('No se pudo enviar la notificacion de prueba');
		}
	};

	return (
		<View style={styles.container}>
			{/* Navbar - Desktop only */}
			{!isSmallScreen && (
				<View style={styles.navbar}>
					<View style={styles.navContent}>
						{/* Logo y Título a la izquierda */}
						<View style={styles.navLeft}>
							<Text style={styles.navTitle}>UniConnect</Text>
						</View>

						{/* Logo Universidad de Caldas a la derecha */}
						<View style={styles.navRight}>
							<Image
								source={require('../../assets/images/logo-caldas.png')}
								style={styles.logoPlaceholder}
								resizeMode="contain"
							/>
						</View>
					</View>
				</View>
			)}

			{/* Logo centrado en móvil */}
			{isSmallScreen && (
				<View style={styles.mobileLogoContainer}>
					<Image
						source={require('../../assets/images/logo-caldas.png')}
						style={styles.mobileLogoImage}
						resizeMode="contain"
					/>
					<Text style={styles.mobileNavTitle}>UniConnect</Text>
				</View>
			)}

			{/* Contenido Principal Centrado */}
			<View style={[styles.mainContent, isSmallScreen && { paddingTop: 120 }]}>
				{/* Título de bienvenida */}
				<Text style={styles.welcomeTitle}>Bienvenido a UniConnect</Text>
				<Text style={styles.welcomeSubtitle}>Plataforma de conexión universitaria</Text>

				{/* Contenedor de botones - responsive */}
				<View style={styles.buttonsContainer}>
					{/* Botón Registro */}
					<Pressable
						style={[
							styles.button,
							styles.buttonPrimary,
							hoveredButton === 'registro' && styles.buttonPrimaryHover,
						]}
						onPress={handleRegisterPress}
						onPressIn={() => setHoveredButton('registro')}
						onPressOut={() => setHoveredButton(null)}
					>
						<Text
							style={[
								styles.buttonText,
								hoveredButton === 'registro' && styles.buttonTextHover,
							]}
						>
							Registro
						</Text>
					</Pressable>

					{/* Botón Login */}
					<Pressable
						style={[
							styles.button,
							styles.buttonSecondary,
							hoveredButton === 'login' && styles.buttonSecondaryHover,
						]}
						onPress={handleLoginPress}
						onPressIn={() => setHoveredButton('login')}
						onPressOut={() => setHoveredButton(null)}
					>
						<Text
							style={[
								styles.buttonText,
								styles.buttonSecondaryText,
								hoveredButton === 'login' && styles.buttonSecondaryTextHover,
							]}
						>
							Login
						</Text>
					</Pressable>

					<Pressable
						style={[
							styles.button,
							styles.buttonPrimary,
							hoveredButton === 'notificaciones' && styles.buttonPrimaryHover,
						]}
						onPress={handleNotificationTestPress}
						onPressIn={() => setHoveredButton('notificaciones')}
						onPressOut={() => setHoveredButton(null)}
					>
						<Text
							style={[
								styles.buttonText,
								hoveredButton === 'notificaciones' && styles.buttonTextHover,
							]}
						>
							Probar notificacion
						</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
}
