import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { EventosScreen } from './src/screens/EventosScreen';
import { GruposScreen } from './src/screens/GruposScreen';

type RootStackParamList = {
  Eventos: undefined;
  Grupos: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

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
