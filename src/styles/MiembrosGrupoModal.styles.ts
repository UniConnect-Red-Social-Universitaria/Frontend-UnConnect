import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#002855',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#94a3b8',
  },
  miembrosCount: {
    fontSize: 14,
    color: '#64748b',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  list: {
    maxHeight: 400,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  miembroItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  miembroInfo: {
    flex: 1,
  },
  miembroNombre: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  miembroEmail: {
    fontSize: 12,
    color: '#64748b',
  },
  adminBadge: {
    fontSize: 11,
    color: '#002855',
    fontWeight: '600',
    marginTop: 4,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
  closeButtonModal: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#002855',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});