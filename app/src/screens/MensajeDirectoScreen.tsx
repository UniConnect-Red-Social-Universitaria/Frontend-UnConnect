import React, { useState } from 'react';
import {
	View,
	Text as RNText,
	FlatList,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
} from 'react-native';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { PrimaryButton, Screen, Text, Title } from '@uniconnect/ui';

import { useChatDirecto } from '../hooks/useChatDirecto';
import { clearUnreadDirectChatNotification } from '../services/notificaciones-chat.service';

import { styles } from '../styles/MensajeDirectoScreen.Styles';

type MensajeDirectoScreenRouteProp = RouteProp<RootStackParamList, 'MensajeDirecto'>;

export default function MensajeDirectoScreen() {
	const route = useRoute<MensajeDirectoScreenRouteProp>();
	const { contactoId, nombre, correo, userId: userIdParam } = route.params;

	const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);

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
		handleReaccionar,
	} = useChatDirecto({ contactoId, userIdParam });

	const onReactionSelect = (emoji: string) => {
		if (reactionMsgId) {
			handleReaccionar(reactionMsgId, emoji);
			setReactionMsgId(null);
		}
	};

	const renderItem = ({ item }: { item: any }) => {
		const esMio = item.emisorId === userId;

		const bubbleStyle = [
			styles.msgBubble, 
			esMio ? styles.msgBubbleYo : styles.msgBubbleOtro
		];

		return (
			<TouchableOpacity 
				activeOpacity={0.8}
				onLongPress={() => {
					setReactionMsgId(item.id);
				}}
				style={bubbleStyle}
			>
				<Text style={[styles.msgText, esMio && { color: '#fff' }]}>{item.contenido}</Text>
				
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
					<Text style={styles.msgDate}>
						{new Date(item.createdAt).toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						})}
					</Text>
				</View>

				{item.reacciones && item.reacciones.length > 0 && (
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', padding: 4, borderRadius: 8, alignSelf: 'flex-start' }}>
						{Array.from(new Set(item.reacciones.map((r: any) => r.emoji))).map((emoji: any, index) => {
							const count = item.reacciones.filter((r: any) => r.emoji === emoji).length;
							const didIReact = item.reacciones.some((r: any) => r.emoji === emoji && r.usuarioId === userId);
							return (
								<TouchableOpacity key={index} onPress={() => handleReaccionar(item.id, emoji)} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 6, backgroundColor: didIReact ? 'rgba(0,40,85,0.2)' : 'transparent', borderRadius: 10, paddingHorizontal: 4 }}>
									<RNText style={{ fontSize: 14 }}>{emoji}</RNText>
									{count > 1 && <RNText style={{ fontSize: 10, marginLeft: 2 }}>{count}</RNText>}
								</TouchableOpacity>
							);
						})}
					</View>
				)}
			</TouchableOpacity>
		);
	};

	return (
		<Screen style={styles.container}>
			<View style={styles.header}>
				<Title style={styles.title}>Chat con {nombre}</Title>
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

						{reactionMsgId && (
							<View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 8, marginBottom: 8, alignSelf: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, elevation: 4 }}>
								<TouchableOpacity onPress={() => onReactionSelect('👍')} style={{ marginHorizontal: 8 }}><RNText style={{ fontSize: 24 }}>👍</RNText></TouchableOpacity>
								<TouchableOpacity onPress={() => onReactionSelect('❤️')} style={{ marginHorizontal: 8 }}><RNText style={{ fontSize: 24 }}>❤️</RNText></TouchableOpacity>
								<TouchableOpacity onPress={() => onReactionSelect('😂')} style={{ marginHorizontal: 8 }}><RNText style={{ fontSize: 24 }}>😂</RNText></TouchableOpacity>
								<TouchableOpacity onPress={() => setReactionMsgId(null)} style={{ marginHorizontal: 8 }}><RNText style={{ fontSize: 24, color: '#94a3b8' }}>✕</RNText></TouchableOpacity>
							</View>
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

							<PrimaryButton
								style={styles.sendBtn}
								onPress={handleEnviarMensaje}
								disabled={enviando}
							>
								<RNText style={styles.sendText}>{enviando ? '...' : 'Enviar'}</RNText>
							</PrimaryButton>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Screen>
	);
}
