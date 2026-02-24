import { StyleSheet } from 'react-native';
import theme from './theme';

const globalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  logoImage: {
  width: 50,
  height: 50,
  resizeMode: 'contain',
 },
  header: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  title: {
    color: theme.colors.gold,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
  },
  text: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.fontSize.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.goldLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  muted: {
    color: theme.colors.primaryMid,
    fontSize: theme.typography.fontSize.sm,
  },
});

export default globalStyles;
export { globalStyles };
