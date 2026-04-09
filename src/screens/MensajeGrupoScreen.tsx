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
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';

import { useChatGrupo } from '../hooks/useChatGrupo';
import { clearUnreadGroupChatNotification } from '../services/notificaciones-chat.service';

import { styles } from '../styles/MensajeDirectoScreen.Styles';

type MensajeGrupoScreenRouteProp = RouteProp<RootStackParamList, 'MensajeGrupo'>;

export default function MensajeGrupoScreen() {
	const route = useRoute<MensajeGrupoScreenRouteProp>();
	const { grupoId, nombreGrupo, userId: userIdParam } = route.params;

	useFocusEffect(
		React.useCallback(() => {
			void clearUnreadGroupChatNotification(grupoId);
			return undefined;
		}, [grupoId])
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
	} = useChatGrupo({ grupoId, userIdParam });

	const renderItem = ({ item }: { item: any }) => {
		const esMio = item.emisorId === userId;

		return (
			<View style={[styles.msgBubble, esMio ? styles.msgBubbleYo : styles.msgBubbleOtro]}>
				{!esMio && item.emisor && (
					<Text
						style={{
							fontSize: 12,
							fontWeight: 'bold',
							color: '#002855',
							marginBottom: 2,
						}}
					>
						{item.emisor.nombre} {item.emisor.apellido}
					</Text>
				)}

				<Text style={[styles.msgText, esMio && { color: '#fff' }]}>{item.contenido}</Text>
				<Text style={styles.msgDate}>
					{new Date(item.createdAt).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</Text>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<SafeAreaView style={styles.safeHeader} edges={['top']}>
				<View style={styles.header}>
					<Text style={styles.title}>{nombreGrupo}</Text>
					<Text style={styles.subtitle}>Chat de Grupo</Text>
				</View>
			</SafeAreaView>

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
									placeholder="Escribe al grupo..."
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
		</View>
	);
}
