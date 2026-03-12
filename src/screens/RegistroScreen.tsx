import React, { useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Image,
	Alert,
	ActivityIndicator,
} from 'react-native';
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

			if (!googleUser.email.endsWith(`@${allowedDomain}`)) {
				Alert.alert(
					'Acceso denegado',
					`Por favor, utiliza exclusivamente tu correo institucional (@${allowedDomain}).`
				);
				if (signOut) signOut();
				return;
			}

			const googleDataReal = {
				nombre: googleUser.given_name || googleUser.name?.split(' ')[0] || '',
				apellido:
					googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
				correo: googleUser.email,
				googleIdToken: googleUser.idToken || googleUser.id || '',
			};

			console.log('¡Login con Auth0 exitoso!', googleDataReal.correo);

			navigation.navigate('CompletarRegistro', {
				googleData: googleDataReal,
			});
		}
	}, [user, navigation, signOut]);

	return (
		<View style={globalStyles.safeArea}>
			<View style={styles.container}>
				<Image
					source={require('../../assets/images/logo-caldas.png')}
					style={styles.logo}
				/>

				<Text style={styles.title}>Registro Institucional</Text>

				<Text style={styles.subtitle}>
					Para unirte a UniConnect, es necesario ingresar exclusivamente con tu cuenta de
					correo institucional de la Universidad de Caldas.
				</Text>

				{error ? (
					<Text style={{ color: 'red', marginBottom: 16, textAlign: 'center' }}>
						{error}
					</Text>
				) : null}

				<TouchableOpacity
					style={[styles.googleButton, (!request || loading) && { opacity: 0.7 }]}
					onPress={signIn}
					disabled={!request || loading}
				>
					{loading ? (
						<ActivityIndicator color="#ffffff" />
					) : (
						<Text style={styles.googleButtonText}>
							Continuar con cuenta institucional
						</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => navigation.goBack()}
					style={styles.backButton}
					disabled={loading}
				>
					<Text style={styles.backButtonText}>Volver al inicio</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
