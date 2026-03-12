import { StyleSheet, useWindowDimensions } from 'react-native';
import theme from '../styles/theme';

export const useHomeScreenStyles = () => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  return StyleSheet.create({
    // Layout Principal
    container: {
      flex: 1,
      backgroundColor: theme.colors.white,
    },

    // Navbar
    navbar: {
      backgroundColor: theme.colors.primary,
      borderBottomWidth: 3,
      borderBottomColor: theme.colors.gold,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    navContent: {
      flexDirection: 'row',
      justifyContent: isSmallScreen ? 'center' : 'space-between',
      alignItems: 'center',
      maxHeight: 60,
    },
    navLeft: {
      flex: isSmallScreen ? 0 : 1,
      justifyContent: 'center',
      marginRight: isSmallScreen ? 0 : theme.spacing.lg,
    },
    navRight: {
      justifyContent: 'center',
      alignItems: 'center',
      display: isSmallScreen ? 'none' : 'flex',
    },
    navTitle: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSize.xl,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginTop: theme.spacing.md,
    },

    // Logo Placeholder
    logoPlaceholder: {
      width: 50,
      height: 50,
    },

    // Contenido Principal - Centrado
    mainContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
    },

    // Layout móvil - Logo centrado arriba
    mobileLogoContainer: {
      position: 'absolute',
      top: theme.spacing.xl + theme.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    mobileLogoImage: {
      width: 120,
      height: 120,
      borderRadius: theme.radius.md,
      backgroundColor: 'transparent',
      borderWidth: 0,
      tintColor: theme.colors.primaryDark,
    },
    mobileNavTitle: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '700',
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },

    // Textos de Bienvenida
    welcomeTitle: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.xl,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    welcomeSubtitle: {
      color: theme.colors.primaryMid,
      fontSize: theme.typography.fontSize.md,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },

    // Contenedor de Botones
    buttonsContainer: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      gap: theme.spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },

    // Botones
    button: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 140,
      width: isSmallScreen ? '100%' : 'auto',
      maxWidth: isSmallScreen ? 300 : 'auto',
    },
    buttonPrimary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    buttonPrimaryHover: {
      backgroundColor: theme.colors.primaryDark,
      borderColor: theme.colors.gold,
    },
    buttonSecondary: {
      backgroundColor: theme.colors.gold,
      borderWidth: 2,
      borderColor: theme.colors.gold,
    },
    buttonSecondaryHover: {
      backgroundColor: theme.colors.goldDark,
      borderColor: theme.colors.primary,
    },

    // Texto de Botones
    buttonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: theme.colors.white,
    },
    buttonTextHover: {
      color: theme.colors.goldLight,
    },
    buttonSecondaryText: {
      color: theme.colors.primaryDark,
    },
    buttonSecondaryTextHover: {
      color: theme.colors.white,
    },
  });
};
