import { StyleSheet } from 'react-native';

export const localStyles = StyleSheet.create({
    listContainer: {
        paddingBottom: 16,
        gap: 12,
    },
    emptyListContainer: {
        flexGrow: 1,
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A4478',
    },
    counter: {
        fontSize: 12,
        fontWeight: '700',
        color: '#C62828',
    },
    cardMessage: {
        fontSize: 14,
        color: '#3E566E',
        marginBottom: 10,
    },
    typePill: {
        alignSelf: 'flex-start',
        fontSize: 11,
        fontWeight: '700',
        color: '#0A4478',
        backgroundColor: '#E8F2FB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        marginBottom: 8,
    },
    viewButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#003d70',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    viewButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});