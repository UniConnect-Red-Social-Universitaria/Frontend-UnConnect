import { StyleSheet } from 'react-native';

export const localStyles = StyleSheet.create({
    listContainer: {
        paddingBottom: 16,
        gap: 12,
    },
    emptyListContainer: {
        flexGrow: 1,
    },
    centerText: {
        textAlign: 'center',
        fontSize: 15,
        color: '#55657a',
        marginTop: 16,
    },
    emptyState: {
        paddingTop: 28,
        alignItems: 'center',
        paddingHorizontal: 18,
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
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#D8E3EE',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A4478',
    },
    email: {
        fontSize: 13,
        color: '#58708A',
        marginTop: 2,
        marginBottom: 10,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    acceptButton: {
        backgroundColor: '#0f766e',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    rejectButton: {
        backgroundColor: '#b91c1c',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
});