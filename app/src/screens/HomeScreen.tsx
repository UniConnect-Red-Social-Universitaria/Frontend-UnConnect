import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import theme from '@uniconnect/theme';
import {
	Card,
	Container,
	Header,
	MutedText,
	PrimaryButton,
	Screen,
	SecondaryButton,
	Title,
} from '@uniconnect/ui';

export default function HomeScreen({ navigation }: any) {
	const { width } = useWindowDimensions();

	// Determinar si es pantalla pequeña (móvil)
	const isSmallScreen = width < 768;
	const styles = getStyles(isSmallScreen);

	const handleRegisterPress = () => {
		navigation.navigate('Registro');
	};
	const handleLoginPress = () => {
		navigation.navigate('Login');
	};

	return (
		<Screen>
			<Header
				title="UniConnect"
				right={
					!isSmallScreen ? (
						<Image
							source={require('../../assets/images/logo-caldas.png')}
							style={styles.logo}
							resizeMode="contain"
						/>
					) : null
				}
			/>
			<Container style={styles.container}>
				<View style={styles.center}>
					<Card>
						<Title>Bienvenido a UniConnect</Title>
						<MutedText>Plataforma de conexión universitaria</MutedText>

						<View style={styles.buttonsRow}>
							<PrimaryButton
								title="Registro"
								onPress={handleRegisterPress}
								style={styles.button}
							/>
							<SecondaryButton
								title="Login"
								onPress={handleLoginPress}
								style={[styles.button, styles.buttonLast]}
							/>
						</View>
					</Card>
				</View>
			</Container>
		</Screen>
	);
}

function getStyles(isSmallScreen: boolean) {
	return StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: 'center',
		},
		center: {
			width: '100%',
			alignSelf: 'center',
			maxWidth: 520,
		},
		buttonsRow: {
			marginTop: theme.spacing.lg,
			flexDirection: isSmallScreen ? 'column' : 'row',
		},
		button: {
			width: isSmallScreen ? '100%' : undefined,
			marginBottom: isSmallScreen ? theme.spacing.md : 0,
			marginRight: !isSmallScreen ? theme.spacing.lg : 0,
		},
		buttonLast: {
			marginRight: 0,
			marginBottom: 0,
		},
		logo: {
			width: 40,
			height: 40,
		},
	});
}
