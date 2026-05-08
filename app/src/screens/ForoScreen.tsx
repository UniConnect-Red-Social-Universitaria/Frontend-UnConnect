import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { foroService, ForoPregunta, ForoRespuesta } from '../services/foro.service';
import { showToast } from '../utils/toast';
import theme from '../styles/theme';

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
  const [respuestas, setRespuestas] = useState<ForoRespuesta[]>([]);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<ForoPregunta | null>(null);
  const [cargando, setCargando] = useState(false);

  const [modalPregunta, setModalPregunta] = useState(false);
  const [modalRespuesta, setModalRespuesta] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargarPreguntas = useCallback(async () => {
    setCargando(true);
    try {
      const data = await foroService.obtenerPreguntas(materiaId);
      setPreguntas(data);
    } catch {
      showToast('Error al cargar preguntas');
    } finally {
      setCargando(false);
    }
  }, [materiaId]);

  const cargarRespuestas = useCallback(async (preguntaId: string) => {
    setCargando(true);
    try {
      const data = await foroService.obtenerRespuestas(preguntaId);
      setRespuestas(data);
    } catch {
      showToast('Error al cargar respuestas');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPreguntas();
  }, [cargarPreguntas]);

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
      setPreguntas(prev => [nueva, ...prev]);
      setTitulo('');
      setContenido('');
      setModalPregunta(false);
      showToast('Pregunta publicada');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'No puedes publicar en esta asignatura');
    } finally {
      setEnviando(false);
    }
  };

  const handlePublicarRespuesta = async () => {
    if (!contenido.trim() || !preguntaSeleccionada) return;
    setEnviando(true);
    try {
      const nueva = await foroService.publicarRespuesta(preguntaSeleccionada.id, materiaId, contenido);
      setRespuestas(prev => [...prev, nueva].sort((a, b) => b.puntuacion - a.puntuacion));
      setContenido('');
      setModalRespuesta(false);
      showToast('Respuesta publicada');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'No puedes responder en esta asignatura');
    } finally {
      setEnviando(false);
    }
  };

  const handleVotar = async (respuestaId: string, valor: 1 | -1) => {
    try {
      const actualizada = await foroService.votarRespuesta(respuestaId, valor);
      setRespuestas(prev =>
        prev
          .map(r => (r.id === respuestaId ? actualizada : r))
          .sort((a, b) => b.puntuacion - a.puntuacion),
      );
    } catch {
      showToast('Error al votar');
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
          {vista === 'preguntas' ? `Foro · ${materiaNombre}` : preguntaSeleccionada?.titulo}
        </Text>
        <Pressable
          onPress={() => (vista === 'preguntas' ? setModalPregunta(true) : setModalRespuesta(true))}
          style={s.addBtn}
        >
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </Pressable>
      </View>

      {/* Lista preguntas */}
      {vista === 'preguntas' && (
        cargando ? (
          <ActivityIndicator style={s.loader} color={theme.colors.primary} />
        ) : (
          <FlatList
            data={preguntas}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            ListEmptyComponent={<Text style={s.empty}>No hay preguntas aún. ¡Sé el primero!</Text>}
            renderItem={({ item }) => (
              <Pressable style={s.card} onPress={() => abrirPregunta(item)}>
                <Text style={s.cardTitle}>{item.titulo}</Text>
                <Text style={s.cardMeta}>{item.autorNombre} · {new Date(item.createdAt).toLocaleDateString()}</Text>
                <Text style={s.cardPreview} numberOfLines={2}>{item.contenido}</Text>
              </Pressable>
            )}
          />
        )
      )}

      {/* Lista respuestas */}
      {vista === 'respuestas' && (
        cargando ? (
          <ActivityIndicator style={s.loader} color={theme.colors.primary} />
        ) : (
          <FlatList
            data={respuestas}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            ListEmptyComponent={<Text style={s.empty}>No hay respuestas aún.</Text>}
            renderItem={({ item }) => (
              <View style={s.card}>
                <Text style={s.cardContent}>{item.contenido}</Text>
                <Text style={s.cardMeta}>{item.autorNombre} · {new Date(item.createdAt).toLocaleDateString()}</Text>
                <View style={s.voteRow}>
                  <Pressable onPress={() => handleVotar(item.id, 1)} style={s.voteBtn}>
                    <Ionicons name="arrow-up-circle" size={24} color={theme.colors.primary} />
                  </Pressable>
                  <Text style={s.score}>{item.puntuacion}</Text>
                  <Pressable onPress={() => handleVotar(item.id, -1)} style={s.voteBtn}>
                    <Ionicons name="arrow-down-circle" size={24} color="#e74c3c" />
                  </Pressable>
                </View>
              </View>
            )}
          />
        )
      )}

      {/* Modal nueva pregunta */}
      <Modal visible={modalPregunta} transparent animationType="slide">
        <View style={s.modalOverlay}>
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
              <Pressable style={s.btnPrimary} onPress={handlePublicarPregunta} disabled={enviando}>
                <Text style={s.btnPrimaryText}>{enviando ? 'Publicando...' : 'Publicar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal nueva respuesta */}
      <Modal visible={modalRespuesta} transparent animationType="slide">
        <View style={s.modalOverlay}>
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
              <Pressable style={s.btnPrimary} onPress={handlePublicarRespuesta} disabled={enviando}>
                <Text style={s.btnPrimaryText}>{enviando ? 'Publicando...' : 'Responder'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  back: { marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  addBtn: { marginLeft: 8 },
  loader: { flex: 1, marginTop: 40 },
  list: { padding: 12, gap: 10 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardContent: { fontSize: 14, color: '#333', marginBottom: 8 },
  cardMeta: { fontSize: 12, color: '#999', marginBottom: 4 },
  cardPreview: { fontSize: 13, color: '#555' },
  voteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  voteBtn: { padding: 4 },
  score: { fontSize: 16, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14 },
  inputMulti: { height: 100, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btnSecondary: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  btnPrimary: { padding: 12, borderRadius: 8, backgroundColor: theme.colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
});
