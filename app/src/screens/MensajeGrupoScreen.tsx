import React, { useState, useEffect } from 'react';
import {
	View,
	Text as RNText,
	FlatList,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { PollCard, PollCreateModal, PrimaryButton, SecondaryButton, Screen, Text, Title } from '@uniconnect/ui';

import { useChatGrupo } from '../hooks/useChatGrupo';
import { clearUnreadGroupChatNotification } from '../services/notificaciones-chat.service';
import { MiembrosGrupoModal } from '../components/MiembrosGrupoModal';
import { gruposService } from '../services/grupos.service';

import { styles } from '../styles/MensajeDirectoScreen.Styles';

type MensajeGrupoScreenRouteProp = RouteProp<RootStackParamList, 'MensajeGrupo'>;

export default function MensajeGrupoScreen() {
	const route = useRoute<MensajeGrupoScreenRouteProp>();
	const { grupoId, nombreGrupo, userId: userIdParam } = route.params;
	const [mostrarMiembros, setMostrarMiembros] = useState(false);
	const [mostrarEncuestaVisible, setMostrarEncuestaVisible] = useState(false);

	const [miembros, setMiembros] = useState<any[]>([]);
	const [mencionQuery, setMencionQuery] = useState<string | null>(null);
	const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);

	useEffect(() => {
		if (grupoId) {
			gruposService.getMiembros(grupoId).then(m => setMiembros(m)).catch(() => {});
		}
	}, [grupoId]);

	useFocusEffect(
		React.useCallback(() => {
			void clearUnreadGroupChatNotification(grupoId);
			return undefined;
		}, [grupoId])
	);

	const {
		items,
		nuevoMensaje,
		setNuevoMensaje,
		enviando,
		error,
		userId,
		votandoEncuestaId,
		flatListRef,
		handleEnviarMensaje,
		handleVotarEncuesta,
		handleCrearEncuesta,
		handleReaccionar,
	} = useChatGrupo({ grupoId, userIdParam });

	const handleTextChange = (text: string) => {
		setNuevoMensaje(text);
		
		const match = text.match(/@(\w*)$/);
		if (match) {
			setMencionQuery(match[1]);
		} else {
			setMencionQuery(null);
		}
	};

	const selectMencion = (username: string) => {
		setNuevoMensaje(prev => prev.replace(/@\w*$/, `@${username} `));
		setMencionQuery(null);
	};

	const miembrosFiltrados = miembros.filter(m => 
		mencionQuery !== null && m.nombre?.toLowerCase().startsWith(mencionQuery.toLowerCase())
	);

	const onReactionSelect = (emoji: string) => {
		if (reactionMsgId) {
			handleReaccionar(reactionMsgId, emoji);
			setReactionMsgId(null);
		}
	};

	const renderItem = ({ item }: { item: any }) => {
		if (item._type === 'encuesta') {
			return (
				<View style={{ marginVertical: 6, marginHorizontal: 4 }}>
					<PollCard
						encuesta={item}
						onVote={handleVotarEncuesta}
						voting={votandoEncuestaId === item.id}
					/>
				</View>
			);
		}

		const esMio = item.emisorId === userId;

		// Mostrar menciones de color diferente
		const isMention = item.menciones?.some((m: any) => m.usuarioMencionadoId === userId);
		const bubbleStyle = [
			styles.msgBubble, 
			esMio ? styles.msgBubbleYo : styles.msgBubbleOtro,
			isMention && !esMio ? { borderColor: '#ffd700', borderWidth: 2 } : null
		];

		return (
			<TouchableOpacity 
				activeOpacity={0.8}
				onLongPress={() => {
					setReactionMsgId(item.id);
				}}
				style={bubbleStyle}
			>
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
				<View style={styles.chatHeaderRow}>
					<TouchableOpacity style={styles.headerContent} onPress={() => setMostrarMiembros(true)}>
					<Title style={styles.title}>{nombreGrupo}</Title>
					<Text style={styles.subtitle}>Chat de Grupo</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.pollHeaderButton}
						onPress={() => setMostrarEncuestaVisible(true)}
						accessibilityRole="button"
						accessibilityLabel="Nueva encuesta"
					>
						<Ionicons name="stats-chart-outline" size={26} color="#002855" />
					</TouchableOpacity>
				</View>
			</View>

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				keyboardVerticalOffset={0}
			>
				<View style={styles.chatWrapper}>
					<FlatList
						ref={flatListRef}
						data={items}
						renderItem={renderItem}
						keyExtractor={(item) => `${item._type}-${item.id}`}
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
								<TouchableOpacity onPress={() => setReactionMsgId(null)} style={{ marginHorizontal: 8 }}><Ionicons name="close-circle" size={24} color="#94a3b8" /></TouchableOpacity>
							</View>
						)}

						{mencionQuery !== null && miembrosFiltrados.length > 0 && (
							<View style={{ backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, maxHeight: 150, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, elevation: 4 }}>
								<FlatList
									data={miembrosFiltrados}
									keyExtractor={(m) => m.id}
									renderItem={({ item: m }) => (
										<TouchableOpacity onPress={() => selectMencion(m.nombre)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
											<RNText style={{ fontWeight: 'bold' }}>{m.nombre} <RNText style={{ fontWeight: 'normal' }}>{m.apellido}</RNText></RNText>
										</TouchableOpacity>
									)}
								/>
							</View>
						)}

						<View style={styles.inputRow}>
							<View style={styles.inputContainer}>
								<TextInput
									style={styles.input}
									value={nuevoMensaje}
									onChangeText={handleTextChange}
									placeholder="Escribe al grupo..."
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
			<MiembrosGrupoModal
				visible={mostrarMiembros}
				onClose={() => setMostrarMiembros(false)}
				grupoId={grupoId!}
				nombreGrupo={nombreGrupo!}
			/>
			<PollCreateModal
				visible={mostrarEncuestaVisible}
				title="Crear encuesta en el grupo"
				subtitle={`La encuesta se publicará en ${nombreGrupo}.`}
				onClose={() => setMostrarEncuestaVisible(false)}
				onSubmit={async (payload) => {
					await handleCrearEncuesta(payload);
				}}
			/>
		</Screen>
	);
}
