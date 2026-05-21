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
  CrearRespuesta: { preguntaId: string; materiaId: string; materiaNombre: string };
  Foro: { materiaId: string; materiaNombre: string; refresh?: number };
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CrearRespuesta'>;
  route: RouteProp<RootStackParamList, 'CrearRespuesta'>;
};

export default function CrearRespuestaScreen({ navigation, route }: Props) {
  const { preguntaId, materiaId, materiaNombre } = route.params;
  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleResponder = async () => {
    if (!contenido.trim()) return;
    setEnviando(true);
    try {
      await foroService.publicarRespuesta(preguntaId, materiaId, contenido);
      showToast.success('Respuesta publicada');
      navigation.navigate('Foro', { materiaId, materiaNombre, refresh: Date.now() });
    } catch (e: any) {
      showToast.error(e?.message || 'No puedes responder en esta asignatura');
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
        <Text style={styles.headerTitle}>Responder</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.hint}>Escribe tu respuesta:</Text>

        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Escribe tu respuesta..."
          value={contenido}
          onChangeText={setContenido}
          multiline
          autoFocus
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
            <Text style={styles.btnSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, enviando && { opacity: 0.7 }]}
            onPress={handleResponder}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Responder</Text>
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
  hint: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1e293b', marginBottom: 12, backgroundColor: '#fff',
  },
  inputMulti: { height: 140, textAlignVertical: 'top' },
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
