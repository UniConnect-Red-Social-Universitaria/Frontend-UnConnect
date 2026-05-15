import React, { useEffect } from 'react';
import {
	View,
	Pressable,
	Image,
	Alert,
	ActivityIndicator,
	Text as RNText,
} from 'react-native';
import { PrimaryButton, Screen, Text, Title } from '@uniconnect/ui';
import globalStyles from '../styles/global';
import { useRegistroScreenStyles } from '../styles/RegistroScreen.styles';
import { useGoogleAuth } from '../../Hooks/useGoogleAuth';

interface GoogleUser {
	name?: string;
	email: string;
	picture?: string;
	given_name?: string;
	family_name?: string;
	id?: string;
	idToken?: string;
}

export default function RegistroScreen({ navigation }: any) {
	const styles = useRegistroScreenStyles();

	const { user, error, loading, request, signIn, signOut } = useGoogleAuth();

	useEffect(() => {
		if (user) {
			const googleUser = user as GoogleUser;
			const allowedDomain = process.env.EXPO_PUBLIC_ALLOWED_DOMAIN || 'ucaldas.edu.co';
			const email = String(googleUser.email || '')
				.trim()
				.toLowerCase();

			if (!email.endsWith(`@${allowedDomain}`)) {
				Alert.alert(
					'Acceso denegado',
					`Por favor, utiliza exclusivamente tu correo institucional (@${allowedDomain}).`
				);
				if (signOut) signOut();
				return;
			}

			if (!googleUser.idToken) {
				Alert.alert(
					'Inicio incompleto',
					'No se pudo obtener el token de identidad de Google. Intenta nuevamente.'
				);
				if (signOut) signOut();
				return;
			}

			const googleDataReal = {
				nombre: googleUser.given_name || googleUser.name?.split(' ')[0] || '',
				apellido:
					googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
				correo: email,
				googleIdToken: googleUser.idToken,
			};

			console.log('¡Login con Google exitoso!', googleDataReal.correo);

			navigation.navigate('CompletarRegistro', {
				googleData: googleDataReal,
			});
		}
	}, [user, navigation, signOut]);

	return (
		<Screen style={globalStyles.safeArea}>
			<View style={styles.container}>
				<Image
					source={require('../../assets/images/logo-caldas.png')}
					style={styles.logo}
				/>

				<Title style={styles.title}>Registro Institucional</Title>

				<Text style={styles.subtitle}>
					Para unirte a UniConnect, es necesario ingresar exclusivamente con tu cuenta de
					correo institucional de la Universidad de Caldas.
				</Text>

				{error ? (
					<Text style={{ color: 'red', marginBottom: 16, textAlign: 'center' }}>
						{error}
					</Text>
				) : null}

				<PrimaryButton
					style={styles.googleButton}
					onPress={signIn}
					disabled={!request || loading}
				>
					{loading ? (
						<ActivityIndicator color="#ffffff" />
					) : (
						<RNText style={styles.googleButtonText}>
							Continuar con cuenta institucional
						</RNText>
					)}
				</PrimaryButton>

				<Pressable
					onPress={() => navigation.goBack()}
					style={styles.backButton}
					disabled={loading}
				>
					<RNText style={styles.backButtonText}>Volver al inicio</RNText>
				</Pressable>
			</View>
		</Screen>
	);
}
