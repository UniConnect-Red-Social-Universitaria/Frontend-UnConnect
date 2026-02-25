import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import PrincipalScreen from '../screens/PrincipalScreen';
import { GruposScreen } from '../screens/GruposScreen';
import { EventosScreen } from '../screens/EventosScreen';
import theme from '../styles/theme';
import RegistroScreen from '../screens/RegistroScreen';
import CompletarRegistroScreen from '../screens/CompletarRegistroScreen';

export type RootStackParamList = {
  Home: undefined;
  Principal: undefined;
  Grupos: undefined;
  Eventos: undefined;
  Registro: undefined;
  CompletarRegistro: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
