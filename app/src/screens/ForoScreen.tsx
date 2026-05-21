import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
	ActivityIndicator,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
	StyleSheet,
	StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { foroService, ForoPregunta, ForoRespuesta } from '../services/foro.service';
import { showToast } from '../utils/toast';
import theme from '../styles/theme';

type ForoRespuestaUI = ForoRespuesta & {
	miVoto?: 1 | -1 | null;
};

type RootStackParamList = {
	Foro: { materiaId: string; materiaNombre: string };
};

type ForoScreenProps = {
	navigation: StackNavigationProp<RootStackParamList, 'Foro'>;
	route: RouteProp<RootStackParamList, 'Foro'>;
};

type Vista = 'preguntas' | 'respuestas';

export default function ForoScreen({ navigation, route }: ForoScreenProps) {
	const { materiaId, materiaNombre } = route.params;

	const [vista, setVista] = useState<Vista>('preguntas');
	const [preguntas, setPreguntas] = useState<ForoPregunta[]>([]);
	const [respuestas, setRespuestas] = useState<ForoRespuestaUI[]>([]);
	const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<ForoPregunta | null>(
		null
	);
	const [cargando, setCargando] = useState(false);

	const [modalPregunta, setModalPregunta] = useState(false);
	const [modalRespuesta, setModalRespuesta] = useState(false);
	const [titulo, setTitulo] = useState('');
	const [contenido, setContenido] = useState('');
	const [enviando, setEnviando] = useState(false);
	const [votoEnCurso, setVotoEnCurso] = useState<string | null>(null);

	const cargarPreguntas = useCallback(async () => {
		setCargando(true);
		try {
			const data = await foroService.obtenerPreguntas(materiaId);
			setPreguntas(data);
		} catch {
			showToast.error('Error al cargar preguntas');
		} finally {
			setCargando(false);
		}
	}, [materiaId]);

	const cargarRespuestas = useCallback(async (preguntaId: string) => {
		setCargando(true);
		try {
			const data = await foroService.obtenerRespuestas(preguntaId);
			setRespuestas(data as ForoRespuestaUI[]);
		} catch {
			showToast.error('Error al cargar respuestas');
		} finally {
			setCargando(false);
		}
	}, []);

	useEffect(() => {
		cargarPreguntas();
	}, [cargarPreguntas]);

	useEffect(() => {
		const intervalo = setInterval(() => {
			if (vista === 'preguntas') {
				foroService.obtenerPreguntas(materiaId)
					.then(setPreguntas)
					.catch(() => {});
			} else if (preguntaSeleccionada) {
				foroService.obtenerRespuestas(preguntaSeleccionada.id)
					.then((nuevas) =>
						setRespuestas((prev) =>
							(nuevas as ForoRespuestaUI[]).map((r) => ({
								...r,
								miVoto: prev.find((p) => p.id === r.id)?.miVoto,
							}))
						)
					)
					.catch(() => {});
			}
		}, 15_000);
		return () => clearInterval(intervalo);
	}, [vista, preguntaSeleccionada?.id, materiaId]);

	const abrirPregunta = (pregunta: ForoPregunta) => {
		setPreguntaSeleccionada(pregunta);
		setVista('respuestas');
		cargarRespuestas(pregunta.id);
	};

	const handlePublicarPregunta = async () => {
		if (!titulo.trim() || !contenido.trim()) return;
		setEnviando(true);
		try {
			const nueva = await foroService.publicarPregunta(materiaId, titulo, contenido);
			setPreguntas((prev) => [nueva, ...prev]);
			setTitulo('');
			setContenido('');
			setModalPregunta(false);
			showToast.success('Pregunta publicada');
		} catch (e: any) {
			showToast.error(e?.message || 'No puedes publicar en esta asignatura');
		} finally {
			setEnviando(false);
		}
	};

	const handlePublicarRespuesta = async () => {
		if (!contenido.trim() || !preguntaSeleccionada) return;
		setEnviando(true);
		try {
			await foroService.publicarRespuesta(preguntaSeleccionada.id, materiaId, contenido);
			setContenido('');
			setModalRespuesta(false);
			await cargarRespuestas(preguntaSeleccionada.id);
			showToast.success('Respuesta publicada');
		} catch (e: any) {
			showToast.error(e?.message || 'No puedes responder en esta asignatura');
		} finally {
			setEnviando(false);
		}
	};

	const handleVotar = async (respuestaId: string, valor: 1 | -1) => {
		const respuestaActual = respuestas.find((respuesta) => respuesta.id === respuestaId);
		if (respuestaActual?.miVoto === valor) return;
		if (votoEnCurso === respuestaId) return;
		setVotoEnCurso(respuestaId);
		try {
			const actualizada = await foroService.votarRespuesta(respuestaId, valor);
			setRespuestas((prev) =>
				prev.map((respuesta) =>
					respuesta.id === respuestaId
						? { ...respuesta, puntuacion: actualizada.puntuacion, miVoto: valor }
						: respuesta
				)
			);
		} catch {
			showToast.error('Error al votar');
		} finally {
			setVotoEnCurso((current) => (current === respuestaId ? null : current));
		}
	};

	return (
		<View style={s.container}>
			{/* Header */}
			<View style={s.header}>
				{vista === 'respuestas' ? (
					<Pressable onPress={() => setVista('preguntas')} style={s.back}>
						<Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
					</Pressable>
				) : (
					<Pressable onPress={() => navigation.goBack()} style={s.back}>
						<Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
					</Pressable>
				)}
				<Text style={s.headerTitle} numberOfLines={1}>
					{vista === 'preguntas'
						? `Foro · ${materiaNombre}`
						: preguntaSeleccionada?.titulo}
				</Text>
				<Pressable
					onPress={() =>
						vista === 'preguntas' ? setModalPregunta(true) : setModalRespuesta(true)
					}
					style={s.addBtn}
				>
					<Ionicons name="add-circle" size={28} color={theme.colors.primary} />
				</Pressable>
			</View>

			{/* Lista preguntas */}
			{vista === 'preguntas' &&
				(cargando ? (
					<ActivityIndicator style={s.loader} color={theme.colors.primary} />
				) : (
					<FlatList
						data={preguntas}
						keyExtractor={(item) => item.id}
						contentContainerStyle={s.list}
						ListEmptyComponent={
							<Text style={s.empty}>No hay preguntas aún. ¡Sé el primero!</Text>
						}
						renderItem={({ item }) => (
							<Pressable style={s.card} onPress={() => abrirPregunta(item)}>
								<Text style={s.cardTitle}>{item.titulo}</Text>
								<Text style={s.cardMeta}>
									{item.autorNombre} · {new Date(item.createdAt).toLocaleDateString()}
								</Text>
								<Text style={s.cardPreview} numberOfLines={2}>
									{item.contenido}
								</Text>
							</Pressable>
						)}
					/>
				))}

			{/* Lista respuestas */}
			{vista === 'respuestas' &&
				(cargando ? (
					<ActivityIndicator style={s.loader} color={theme.colors.primary} />
				) : (
					<FlatList
						data={respuestas}
						keyExtractor={(item) => item.id}
						contentContainerStyle={s.list}
						ListEmptyComponent={<Text style={s.empty}>No hay respuestas aún.</Text>}
						renderItem={({ item }) => (
							<View style={s.card}>
								<Text style={s.cardContent}>{item.contenido}</Text>
								<Text style={s.cardMeta}>
									{item.autorNombre} · {new Date(item.createdAt).toLocaleDateString()}
								</Text>
								<Text style={s.voteLabel}>Voto rápido</Text>
								<View style={s.voteRow}>
									<Pressable
										onPress={() => handleVotar(item.id, 1)}
										style={({ pressed }) => [
											s.voteBtn,
											s.voteBtnPositive,
											(votoEnCurso === item.id || item.miVoto === 1) && s.voteBtnDisabled,
											item.miVoto === 1 && s.voteBtnActive,
											pressed && votoEnCurso !== item.id && s.voteBtnPressed,
										]}
										disabled={votoEnCurso === item.id || item.miVoto === 1}
										accessibilityRole="button"
										accessibilityLabel="Votar a favor"
									>
										<Ionicons name="arrow-up" size={16} color="#1e8449" />
									</Pressable>
									<Text
										style={[
											s.score,
											item.puntuacion < 0
												? s.scoreNegative
												: item.puntuacion > 0
													? s.scorePositive
													: s.scoreNeutral,
										]}
									>
										{item.puntuacion > 0
											? `+${item.puntuacion}`
											: String(item.puntuacion)}{' '}
										pts
									</Text>
									<Pressable
										onPress={() => handleVotar(item.id, -1)}
										style={({ pressed }) => [
											s.voteBtn,
											s.voteBtnNegative,
											(votoEnCurso === item.id || item.miVoto === -1) &&
												s.voteBtnDisabled,
											item.miVoto === -1 && s.voteBtnActive,
											pressed && votoEnCurso !== item.id && s.voteBtnPressed,
										]}
										disabled={votoEnCurso === item.id || item.miVoto === -1}
										accessibilityRole="button"
										accessibilityLabel="Votar en contra"
									>
										<Ionicons name="arrow-down" size={16} color="#c0392b" />
									</Pressable>
								</View>
							</View>
						)}
					/>
				))}

			{/* Modal nueva pregunta */}
			<Modal visible={modalPregunta} transparent animationType="slide">
				<View style={s.modalOverlay}>
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : undefined}
						style={{ justifyContent: 'flex-end' }}
					>
						<ScrollView
							keyboardShouldPersistTaps="handled"
							contentContainerStyle={{ justifyContent: 'flex-end' }}
						>
							<View style={s.modal}>
								<Text style={s.modalTitle}>Nueva pregunta</Text>
								<TextInput
									style={s.input}
									placeholder="Título"
									value={titulo}
									onChangeText={setTitulo}
								/>
								<TextInput
									style={[s.input, s.inputMulti]}
									placeholder="Describe tu duda..."
									value={contenido}
									onChangeText={setContenido}
									multiline
								/>
								<View style={s.modalBtns}>
									<Pressable style={s.btnSecondary} onPress={() => setModalPregunta(false)}>
										<Text>Cancelar</Text>
									</Pressable>
									<Pressable
										style={s.btnPrimary}
										onPress={handlePublicarPregunta}
										disabled={enviando}
									>
										<Text style={s.btnPrimaryText}>
											{enviando ? 'Publicando...' : 'Publicar'}
										</Text>
									</Pressable>
								</View>
							</View>
						</ScrollView>
					</KeyboardAvoidingView>
				</View>
			</Modal>

			{/* Modal nueva respuesta */}
			<Modal visible={modalRespuesta} transparent animationType="slide">
				<View style={s.modalOverlay}>
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : undefined}
						style={{ justifyContent: 'flex-end' }}
					>
						<ScrollView
							keyboardShouldPersistTaps="handled"
							contentContainerStyle={{ justifyContent: 'flex-end' }}
						>
							<View style={s.modal}>
								<Text style={s.modalTitle}>Responder</Text>
								<TextInput
									style={[s.input, s.inputMulti]}
									placeholder="Escribe tu respuesta..."
									value={contenido}
									onChangeText={setContenido}
									multiline
								/>
								<View style={s.modalBtns}>
									<Pressable style={s.btnSecondary} onPress={() => setModalRespuesta(false)}>
										<Text>Cancelar</Text>
									</Pressable>
									<Pressable
										style={s.btnPrimary}
										onPress={handlePublicarRespuesta}
										disabled={enviando}
									>
										<Text style={s.btnPrimaryText}>
											{enviando ? 'Publicando...' : 'Responder'}
										</Text>
									</Pressable>
								</View>
							</View>
						</ScrollView>
					</KeyboardAvoidingView>
				</View>
			</Modal>
		</View>
	);
}

const s = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f5f5f5' },
	header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: (StatusBar.currentHeight || 24) + 8,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
},
	back: { marginRight: 8 },
	headerTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
	addBtn: { marginLeft: 8 },
	loader: { flex: 1, marginTop: 40 },
	list: { padding: 12, gap: 10 },
	empty: { textAlign: 'center', color: '#999', marginTop: 40 },
	card: {
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 14,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
	cardContent: { fontSize: 14, color: '#333', marginBottom: 8 },
	cardMeta: { fontSize: 12, color: '#999', marginBottom: 4 },
	cardPreview: { fontSize: 13, color: '#555' },
	voteLabel: {
		marginTop: 6,
		marginBottom: 4,
		fontSize: 11,
		fontWeight: '700',
		color: '#6b7f92',
		textTransform: 'uppercase',
		letterSpacing: 0.4,
	},
	voteRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
		gap: 8,
		flexWrap: 'wrap',
	},
	voteBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#dde4ec',
		backgroundColor: '#f8fbfe',
	},
	voteBtnPositive: { borderColor: '#ccebd8', backgroundColor: '#eefaf2' },
	voteBtnNegative: { borderColor: '#f1cccc', backgroundColor: '#fff2f2' },
	voteBtnActive: {
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 1,
	},
	voteBtnDisabled: { opacity: 0.65 },
	voteBtnPressed: { transform: [{ scale: 0.98 }] },
	voteBtnTextPositive: { color: '#1e8449', fontWeight: '700', fontSize: 13 },
	voteBtnTextNegative: { color: '#c0392b', fontWeight: '700', fontSize: 13 },
	score: {
		fontSize: 14,
		fontWeight: '800',
		minWidth: 70,
		textAlign: 'center',
		paddingVertical: 7,
		paddingHorizontal: 12,
		borderRadius: 999,
		overflow: 'hidden',
	},
	scoreNeutral: { backgroundColor: '#eef4f8', color: '#4a6a85' },
	scorePositive: { backgroundColor: '#e7f7ee', color: '#1e8449' },
	scoreNegative: { backgroundColor: '#fce8e8', color: '#c0392b' },
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'flex-end',
	},
	modal: {
		backgroundColor: '#fff',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		gap: 12,
	},
	modalTitle: { fontSize: 18, fontWeight: '700' },
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 12,
		fontSize: 14,
	},
	inputMulti: { height: 100, textAlignVertical: 'top' },
	modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
	btnSecondary: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
	btnPrimary: { padding: 12, borderRadius: 8, backgroundColor: theme.colors.primary },
	btnPrimaryText: { color: '#fff', fontWeight: '600' },
});
