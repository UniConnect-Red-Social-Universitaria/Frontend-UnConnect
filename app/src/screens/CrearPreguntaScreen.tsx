import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { foroService } from '../services/foro.service';
import { showToast } from '../utils/toast';
import theme from '../styles/theme';

type RootStackParamList = {
  CrearPregunta: { materiaId: string; materiaNombre: string };
  Foro: { materiaId: string; materiaNombre: string; refresh?: number };
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CrearPregunta'>;
  route: RouteProp<RootStackParamList, 'CrearPregunta'>;
};

export default function CrearPreguntaScreen({ navigation, route }: Props) {
  const { materiaId, materiaNombre } = route.params;
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handlePublicar = async () => {
    if (!titulo.trim() || !contenido.trim()) return;
    setEnviando(true);
    try {
      await foroService.publicarPregunta(materiaId, titulo, contenido);
      showToast.success('Pregunta publicada');
      navigation.navigate('Foro', { materiaId, materiaNombre, refresh: Date.now() });
    } catch (e: any) {
      showToast.error(e?.message || 'No puedes publicar en esta asignatura');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva pregunta</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.materiaLabel}>{materiaNombre}</Text>

        <TextInput
          style={styles.input}
          placeholder="Título"
          value={titulo}
          onChangeText={setTitulo}
        />

        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Describe tu duda..."
          value={contenido}
          onChangeText={setContenido}
          multiline
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
            <Text style={styles.btnSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, enviando && { opacity: 0.7 }]}
            onPress={handlePublicar}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Publicar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    paddingTop: (StatusBar.currentHeight || 24) + 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
  },
  backBtn: { marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  body: { flex: 1, padding: 16 },
  materiaLabel: { fontSize: 12, color: '#6366f1', fontWeight: '700', marginBottom: 16, textTransform: 'uppercase' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1e293b', marginBottom: 12, backgroundColor: '#fff',
  },
  inputMulti: { height: 120, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnSecondary: {
    flex: 1, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0',
    alignItems: 'center', backgroundColor: '#fff',
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  btnPrimary: {
    flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
