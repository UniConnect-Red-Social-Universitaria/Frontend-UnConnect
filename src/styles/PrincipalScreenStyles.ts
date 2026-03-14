import { StyleSheet } from 'react-native';
import theme from '../styles/theme';

export const styles = StyleSheet.create({
  // --- CONTENEDOR PRINCIPAL ---
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing?.md || 16,
    paddingTop: (theme.spacing?.xl || 40) + 16,
    paddingBottom: theme.spacing?.lg || 24,
    backgroundColor: theme.colors?.white || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  brandLogo: {
    height: 56,
    minWidth: 160,
    alignSelf: 'flex-start',
    marginLeft: -30,
  },
  brand: {
    color: theme.colors?.gold || '#FFD700',
    fontSize: theme.typography?.fontSize?.lg || 20,
    fontWeight: 'bold',
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F2F7FF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#003d70',
    borderWidth: 1,
    borderColor: '#003d70',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  mainContent: {
    flex: 1,
    padding: theme.spacing?.lg || 20,
  },
  greeting: {
    fontSize: theme.typography?.fontSize?.xl || 24,
    fontWeight: '700',
    color: theme.colors?.primary || '#333333',
    marginBottom: theme.spacing?.sm || 8,
  },
  subtitle: {
    fontSize: theme.typography?.fontSize?.md || 16,
    color: theme.colors?.primaryMid || '#666666',
    marginBottom: theme.spacing?.lg || 24,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: theme.radius?.md || 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: theme.spacing?.md || 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
  },


  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors?.primary,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 48,
    paddingTop: 24,
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 80,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navButtonText: {
    color: theme.colors?.white || '#FFFFFF',
    fontWeight: '600',
    fontSize: 20,
  }
});