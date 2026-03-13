import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eef2f7',
    },
    safeHeader: {
        backgroundColor: '#002855',
    },
    header: {
        paddingVertical: 50,
        paddingHorizontal: 20,
        backgroundColor: '#002855',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#cbd5e1',
        fontSize: 14,
        marginTop: 4,
    },
    chatWrapper: {
        flex: 1,
    },
    list: {
        flex: 1,
    },
    chatContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
    },
    msgBubble: {
        maxWidth: '78%',
        marginBottom: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 18,
    },
    msgBubbleYo: {
        backgroundColor: '#002855',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 6,
    },
    msgBubbleOtro: {
        backgroundColor: '#e2e8f0',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 6,
    },
    msgText: {
        fontSize: 15,
        color: '#111',
    },
    msgDate: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 4,
        textAlign: 'right',
    },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 36,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#e2e8f0',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    inputContainer: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    input: {
        fontSize: 15,
        color: '#000',
    },
    sendBtn: {
        backgroundColor: '#002855',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    sendText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});