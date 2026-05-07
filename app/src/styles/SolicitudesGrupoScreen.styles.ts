import { StyleSheet } from 'react-native';

export const solicitudesGrupoStyles = StyleSheet.create({
	listContainer: {
		paddingBottom: 16,
		gap: 12,
	},
	emptyListContainer: {
		flexGrow: 1,
	},
	emptyState: {
		paddingTop: 40,
		alignItems: 'center',
		paddingHorizontal: 18,
	},
	emptyIconWrap: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: '#EAF3FF',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#003d70',
		marginBottom: 8,
	},
	emptyText: {
		fontSize: 14,
		textAlign: 'center',
		color: '#4a5a6a',
		lineHeight: 20,
	},

	// Grupo section header
	grupoSection: {
		marginBottom: 20,
	},
	grupoHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 12,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#E8F2FB',
	},
	grupoIconWrap: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#EAF3FF',
		alignItems: 'center',
		justifyContent: 'center',
	},
	grupoHeaderText: {
		flex: 1,
	},
	grupoNombre: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0A4478',
	},
	grupoMateria: {
		fontSize: 12,
		color: '#4a5a6a',
		marginTop: 2,
	},
	solicitudesCount: {
		fontSize: 11,
		fontWeight: '700',
		color: '#FFFFFF',
		backgroundColor: '#E53935',
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 999,
		overflow: 'hidden',
	},

	// Solicitud card
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#D8E3EE',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 3,
		elevation: 1,
	},
	cardRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	solicitanteInfo: {
		flex: 1,
		paddingRight: 10,
	},
	solicitanteNombre: {
		fontSize: 15,
		fontWeight: '700',
		color: '#0F172A',
	},
	solicitanteCorreo: {
		fontSize: 12,
		color: '#64748B',
		marginTop: 2,
	},
	solicitanteFecha: {
		fontSize: 11,
		color: '#94A3B8',
		marginTop: 4,
	},
	actionsRow: {
		flexDirection: 'row',
		gap: 8,
	},
	approveButton: {
		backgroundColor: '#16A34A',
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	rejectButton: {
		backgroundColor: '#DC2626',
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	actionButtonDisabled: {
		opacity: 0.5,
	},
	actionButtonText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#FFFFFF',
	},

	// Link button for Notificaciones screen
	linkCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 14,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#D8E3EE',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	linkIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#EAF3FF',
		alignItems: 'center',
		justifyContent: 'center',
	},
	linkTextWrap: {
		flex: 1,
	},
	linkTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#0A4478',
	},
	linkSubtitle: {
		fontSize: 12,
		color: '#64748B',
		marginTop: 2,
	},
	linkChevron: {
		marginLeft: 4,
	},
});
