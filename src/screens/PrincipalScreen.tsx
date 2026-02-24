import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import theme from '../styles/theme';
import globalStyles from '../styles/global';

type RootStackParamList = {
  Principal: undefined;
  Grupos: undefined;
  Eventos: undefined;
};

type PrincipalScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Principal'>;

export default function PrincipalScreen({ navigation }: { navigation: PrincipalScreenNavigationProp }) {
  return (
    <View style={globalStyles.container || { flex: 1 }}>
      {/* Navbar */}
      <View style={[globalStyles.header || {}, styles.navbar]}>
        <Text style={[globalStyles.title || {}, styles.brand]}>UniConnect</Text>
        <View style={styles.navActions}>
          <Pressable
            style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => navigation.navigate('Grupos')}
          >
            <Text style={styles.navButtonText}>Grupos</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.navButton, { marginLeft: 12, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => navigation.navigate('Eventos')}
          >
            <Text style={styles.navButtonText}>Eventos</Text>
          </Pressable>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Bienvenido a UniConnect</Text>
        <Text style={styles.heroSubtitle}>Selecciona una sección arriba para continuar</Text>
      </View>
    </View>
  );
}

const styles = {
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.md,
  },
  brand: {
    color: theme.colors.gold,
    fontSize: theme.typography.fontSize.lg,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  navButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  heroTitle: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    color: theme.colors.primaryMid,
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
  },
} as const;
