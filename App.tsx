import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
	return (
		<NavigationContainer>
			<StatusBar style="dark" />
			<Stack.Navigator
				initialRouteName="Grupos"
				screenOptions={{
					headerStyle: {
						backgroundColor: '#f4c300',
					},
					headerTintColor: '#1f1f1f',
					headerTitleStyle: {
						fontWeight: '700',
					},
					cardStyle: {
						backgroundColor: '#fffef8',
					},
				}}
			>
				<Stack.Screen name="Eventos" component={EventosScreen} />
				<Stack.Screen name="Grupos" component={GruposScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
