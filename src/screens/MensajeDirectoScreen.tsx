import React from 'react';
import {
	View,
	Text,
	FlatList,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatDirecto } from '../hooks/useChatDirecto';
import { clearUnreadDirectChatNotification } from '../services/notificaciones-chat.service';

import { styles } from '../styles/MensajeDirectoScreen.Styles';

type MensajeDirectoScreenRouteProp = RouteProp<RootStackParamList, 'MensajeDirecto'>;

export default function MensajeDirectoScreen() {
	const route = useRoute<MensajeDirectoScreenRouteProp>();
	const { contactoId, nombre, correo, userId: userIdParam } = route.params;

	useFocusEffect(
		React.useCallback(() => {
			void clearUnreadDirectChatNotification(contactoId);
			return undefined;
		}, [contactoId])
	);

	const {
		mensajes,
		nuevoMensaje,
		setNuevoMensaje,
		enviando,
		error,
		userId,
		flatListRef,
		handleEnviarMensaje,
	} = useChatDirecto({ contactoId, userIdParam });

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
		<SafeAreaView style={styles.container} edges={['top']}>
			<View style={styles.header}>
				<Text style={styles.title}>Chat con {nombre}</Text>
				<Text style={styles.subtitle}>{correo}</Text>
			</View>

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				keyboardVerticalOffset={0}
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
							<Text style={{ color: 'red', marginBottom: 4, textAlign: 'center' }}>
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
									onSubmitEditing={handleEnviarMensaje}
									returnKeyType="send"
								/>
							</View>

							<TouchableOpacity
								style={styles.sendBtn}
								onPress={handleEnviarMensaje}
								disabled={enviando}
							>
								<Text style={styles.sendText}>{enviando ? '...' : 'Enviar'}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
