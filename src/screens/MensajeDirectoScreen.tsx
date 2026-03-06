import React, { useEffect, useState, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	FlatList,
	TextInput,
	TouchableOpacity,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { resolverApiBaseUrl } from '../utils/apiConfig';
import { jwtDecode, JwtPayload } from 'jwt-decode';

interface CustomJwt extends JwtPayload {
	id?: string;
	userId?: string;
	usuarioId?: string;
	sub?: string;
}

type MensajeDirectoScreenRouteProp = RouteProp<RootStackParamList, 'MensajeDirecto'>;

export default function MensajeDirectoScreen() {
	const route = useRoute<MensajeDirectoScreenRouteProp>();
	const { contactoId, nombre, correo, userId: userIdParam } = route.params;

	const [mensajes, setMensajes] = useState<any[]>([]);
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
			const token = await AsyncStorage.getItem('userToken');
			if (!token) return;

			if (!userIdParam) {
				try {
					const decoded = jwtDecode<CustomJwt>(token);
					const idDelToken =
						decoded.sub || decoded.id || decoded.userId || decoded.usuarioId;
					if (idDelToken) {
						setUserId(idDelToken);
					}
				} catch (e) {
					console.error('Error decodificando el token:', e);
				}
			}
		})();
	}, []);

	useEffect(() => {
		if (!userId) return;

		let token: string | null = null;

		(async () => {
			token = await AsyncStorage.getItem('userToken');
			if (!token) {
				Alert.alert('Token faltante', 'No se encontró el token.');
				return;
			}

			const res = await fetch(`${API_URL}/mensajes/${contactoId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && Array.isArray(data.data)) {
				setMensajes(data.data);
			}

			if (!socketRef.current) {
				socketRef.current = io(SOCKET_URL, {
					auth: { token },
					transports: ['websocket'],
				});
			} else {
				socketRef.current.auth = { token };
				socketRef.current.connect();
			}

			socketRef.current.off('mensaje');
			socketRef.current.on('mensaje', (msg: any) => {
				if (
					(msg.emisorId === userId && msg.receptorId === contactoId) ||
					(msg.emisorId === contactoId && msg.receptorId === userId)
				) {
					setMensajes((prev) => [...prev, msg]);
					setTimeout(() => {
						flatListRef.current?.scrollToEnd({ animated: true });
					}, 50);
				}
			});
		})();

		return () => {
			socketRef.current?.disconnect();
		};
	}, [contactoId, userId]);

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

			const res = await fetch(`${API_URL}/mensajes`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					receptorId: contactoId,
					contenido: nuevoMensaje.trim(),
				}),
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
			}
		} catch {
			setError('Error de red');
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
		<View style={styles.container}>
			<SafeAreaView style={styles.safeHeader}>
				<View style={styles.header}>
					<Text style={styles.title}>Chat con {nombre}</Text>
					<Text style={styles.subtitle}>{correo}</Text>
				</View>
			</SafeAreaView>

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
			>
				<View style={styles.chatWrapper}>
					<FlatList
						ref={flatListRef}
						data={mensajes}
						renderItem={renderItem}
						keyExtractor={(item) => item.id}
						style={styles.list}
						contentContainerStyle={styles.chatContainer}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
						onContentSizeChange={() =>
							flatListRef.current?.scrollToEnd({ animated: true })
						}
					/>

					<View style={styles.footer}>
						{error && (
							<Text
								style={{
									color: 'red',
									marginBottom: 4,
									textAlign: 'center',
								}}
							>
								{error}
							</Text>
						)}

						<View style={styles.inputRow}>
							<View style={styles.inputContainer}>
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
							</View>

							<TouchableOpacity
								style={styles.sendBtn}
								onPress={enviarMensaje}
								disabled={enviando}
							>
								<Text style={styles.sendText}>{enviando ? '...' : 'Enviar'}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</View>
	);
}

const styles = StyleSheet.create({
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
