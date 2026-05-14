import React, { useState } from 'react';
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

import { styles } from '../styles/MensajeDirectoScreen.Styles';

type MensajeGrupoScreenRouteProp = RouteProp<RootStackParamList, 'MensajeGrupo'>;

export default function MensajeGrupoScreen() {
	const route = useRoute<MensajeGrupoScreenRouteProp>();
	const { grupoId, nombreGrupo, userId: userIdParam } = route.params;
	const [mostrarMiembros, setMostrarMiembros] = useState(false);
	const [mostrarEncuestaVisible, setMostrarEncuestaVisible] = useState(false);

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
	} = useChatGrupo({ grupoId, userIdParam });

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
