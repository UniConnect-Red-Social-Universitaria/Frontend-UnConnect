import { StyleSheet, useWindowDimensions } from "react-native";
import theme from "../styles/theme";

export const useLoginStyles = () => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  return StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      backgroundColor: theme.colors.white,
    },
    container: {
      flex: 1,
      padding: theme.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.xl,
    },
    logoPropio: {
      width: 120,
      height: 120,
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: "bold",
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    subtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.primaryMid,
      textAlign: "center",
      marginBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.sm,
    },

    // Formulario
    formContainer: {
      width: "100%",
      maxWidth: 400,
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    inputGroup: {
      width: "100%",
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: "600",
      color: theme.colors.primaryDark,
      marginBottom: theme.spacing.xs,
    },
    input: {
      backgroundColor: "#F5F5F5",
      borderWidth: 1,
      borderColor: "#E0E0E0",
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.primary,
    },
    errorText: {
      color: "red",
      fontSize: 12,
      marginTop: 4,
    },

    // Botones
    buttonsContainer: {
      width: "100%",
      maxWidth: 400,
      gap: theme.spacing.md,
    },
    button: {
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.md,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      borderWidth: 2,
    },
    buttonPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    buttonPrimaryHover: {
      backgroundColor: theme.colors.primaryDark,
      borderColor: theme.colors.gold,
    },
    buttonPrimaryText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSize.md,
      fontWeight: "700",
    },
    buttonSecondary: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    buttonSecondaryText: {
      color: theme.colors.primaryMid,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: "600",
    },
    errorGeneralContainer: {
      backgroundColor: "#ffe6e6",
      padding: theme.spacing.sm,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: "red",
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
    },
    errorGeneralText: {
      color: "red",
      fontSize: theme.typography.fontSize.sm,
      fontWeight: "600",
      textAlign: "center",
    },
  });
};
