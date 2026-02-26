import React, { useEffect, useState, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	FlatList,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

import io from 'socket.io-client';
import { resolverApiBaseUrl } from '../utils/apiConfig';

type MensajeDirectoScreenRouteProp = RouteProp<RootStackParamList, 'MensajeDirecto'>;

export default function MensajeDirectoScreen() {
	const route = useRoute<MensajeDirectoScreenRouteProp>();
	const { contactoId, nombre, correo, userId: userIdParam } = route.params;

	const [mensajes, setMensajes] = useState<Array<any>>([]);
	const [nuevoMensaje, setNuevoMensaje] = useState('');
	const [userId, setUserId] = useState<string | null>(userIdParam ?? null);
	const [enviando, setEnviando] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const flatListRef = useRef<FlatList<any>>(null);
	const socketRef = useRef<any>(null);

	const apiBaseUrl = resolverApiBaseUrl();
	const API_URL = `${apiBaseUrl}/api`;
	const SOCKET_URL = apiBaseUrl;

	useEffect(() => {
		(async () => {
			// Siempre usar 'userToken' como fuente principal
			const token = await AsyncStorage.getItem('userToken');
			if (!token) {
				Alert.alert('Token faltante', 'No se encontró el token de usuario autenticado.');
				return;
			}

			// Obtener historial de mensajes
			fetch(`${API_URL}/mensajes/${contactoId}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.success && Array.isArray(data.data)) {
						setMensajes(data.data);
					}
				});

			// Conexión socket
			socketRef.current = io(SOCKET_URL, {
				auth: { token },
				transports: ['websocket'],
			});

			socketRef.current.on('mensaje', (msg: any) => {
				// Mostrar solo mensajes entre el usuario autenticado y el contacto
				if (
					(msg.emisorId === msg.usuarioAutenticadoId && msg.receptorId === contactoId) ||
					(msg.emisorId === contactoId && msg.receptorId === msg.usuarioAutenticadoId)
				) {
					setMensajes((prev) => [...prev, msg]);
				}
			});
		})();

		return () => {
			socketRef.current?.disconnect();
		};
	}, [contactoId]);

	const enviarMensaje = async () => {
		setError(null);
		if (!nuevoMensaje.trim()) return;
		setEnviando(true);
		try {
			const token = await AsyncStorage.getItem('userToken');
			if (!token) {
				setError('No autenticado');
				setEnviando(false);
				return;
			}
			const body = {
				receptorId: contactoId,
				contenido: nuevoMensaje.trim(),
			};
			const res = await fetch(`${API_URL}/mensajes`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
			});
			const data = await res.json();
			if (data.success && data.data) {
				setMensajes((prev) => [...prev, data.data]);
				setNuevoMensaje('');
				setTimeout(() => {
					flatListRef.current?.scrollToEnd({ animated: true });
				}, 100);
			} else {
				setError(data.message || 'Error al enviar');
				console.log('Error al enviar:', data);
			}
		} catch (e) {
			setError('Error de red');
			console.log('Error de red:', e);
		}
		setEnviando(false);
	};

	const renderItem = ({ item }: { item: any }) => (
		<View
			style={[
				styles.msgBubble,
				item.emisorId === userId ? styles.msgBubbleYo : styles.msgBubbleOtro,
			]}
		>
			<Text style={[styles.msgText, item.emisorId === userId && { color: '#fff' }]}>
				{item.contenido}
			</Text>
			<Text style={styles.msgDate}>
				{new Date(item.createdAt).toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
				})}
			</Text>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Chat con {nombre}</Text>
				<Text style={styles.subtitle}>{correo}</Text>
			</View>

			<KeyboardAvoidingView
				style={styles.chatWrapper}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				keyboardVerticalOffset={90}
			>
				<FlatList
					ref={flatListRef}
					data={mensajes}
					renderItem={renderItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.chatContainer}
					showsVerticalScrollIndicator={false}
					onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
				/>

				<View style={styles.footer}>
					{error && (
						<Text style={{ color: 'red', marginBottom: 4, textAlign: 'center' }}>
							{error}
						</Text>
					)}
					<View style={styles.inputRow}>
						<TextInput
							style={styles.input}
							value={nuevoMensaje}
							onChangeText={setNuevoMensaje}
							placeholder="Escribe un mensaje..."
							placeholderTextColor="#94a3b8"
							editable={!enviando}
							onSubmitEditing={enviarMensaje}
							returnKeyType="send"
						/>
						<TouchableOpacity
							style={styles.sendBtn}
							onPress={enviarMensaje}
							disabled={enviando}
						>
							<Text style={styles.sendText}>{enviando ? '...' : 'Enviar'}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#eef2f7',
	},

	header: {
		paddingVertical: 18,
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

	chatContainer: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 20,
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
		paddingVertical: 14,
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderColor: '#e2e8f0',
	},

	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f1f5f9',
		borderRadius: 30,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},

	input: {
		flex: 1,
		fontSize: 15,
		paddingVertical: 6,
	},

	sendBtn: {
		backgroundColor: '#002855',
		paddingVertical: 8,
		paddingHorizontal: 18,
		borderRadius: 20,
		marginLeft: 8,
	},

	sendText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 14,
	},
});
