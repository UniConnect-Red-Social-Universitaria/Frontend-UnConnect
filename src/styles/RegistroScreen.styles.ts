import { StyleSheet, useWindowDimensions } from "react-native";
import theme from "../styles/theme";

export const useRegistroScreenStyles = () => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    logo: {
      width: 120,
      height: 120,
      resizeMode: "contain",
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: "bold",
      color: theme.colors.primary,
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
    subtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.primaryMid,
      textAlign: "center",
      marginBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.sm,
      lineHeight: 22,
    },
    googleButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.radius.md,
      width: isSmallScreen ? "100%" : 300,
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    googleButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSize.md,
      fontWeight: "600",
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    backButtonText: {
      color: theme.colors.goldDark,
      fontSize: theme.typography.fontSize.md,
      fontWeight: "500",
    },
  });
};
