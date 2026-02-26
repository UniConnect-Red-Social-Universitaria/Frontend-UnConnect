import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';

import PrincipalScreen from './src/screens/PrincipalScreen';
import { GruposScreen } from './src/screens/GruposScreen';
import { EventosScreen } from './src/screens/EventosScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import CompletarRegistroScreen from './src/screens/CompletarRegistroScreen';
import LoginScreen from './src/screens/LoginScreen';
import ContactScreen from './src/screens/ContactScreen';
import MensajeDirectoScreen from './src/screens/MensajeDirectoScreen';
import theme from './src/styles/theme';
import type { RootStackParamList } from './src/navigation/RootNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
	return (
		<NavigationContainer>
			<StatusBar style="dark" />
			<Stack.Navigator
				initialRouteName="Home"
				screenOptions={{
					headerShown: false,
					cardStyle: {
						backgroundColor: theme.colors.white,
					},
				}}
			>
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen name="Grupos" component={GruposScreen} />
				<Stack.Screen name="Eventos" component={EventosScreen} />
				<Stack.Screen name="Registro" component={RegistroScreen} />
				<Stack.Screen name="CompletarRegistro" component={CompletarRegistroScreen} />
				<Stack.Screen name="Principal" component={PrincipalScreen} />
				<Stack.Screen name="Login" component={LoginScreen} />
				<Stack.Screen name="Contactos" component={ContactScreen} />
				<Stack.Screen name="MensajeDirecto" component={MensajeDirectoScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
