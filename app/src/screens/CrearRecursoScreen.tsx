import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, StatusBar, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { recursosService, Recurso } from '../services/recursos.service';
import { showToast } from '../utils/toast';
import theme from '../styles/theme';

type RootStackParamList = {
  CrearRecurso: { grupoId: string };
  DetalleGrupo: { grupoId: string; refresh?: number; [key: string]: any };
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CrearRecurso'>;
  route: RouteProp<RootStackParamList, 'CrearRecurso'>;
};

export default function CrearRecursoScreen({ navigation, route }: Props) {
  const { grupoId } = route.params;
  const [nombre, setNombre] = useState('');
  const [url, setUrl] = useState('');
  const [tipo, setTipo] = useState('VIDEO');
  const [etiquetas, setEtiquetas] = useState('');
  const [saving, setSaving] = useState(false);

  const tipos = [
    { v: 'VIDEO', icon: '🎬', label: 'Video' },
    { v: 'PDF', icon: '📄', label: 'PDF' },
    { v: 'IMAGEN', icon: '🖼️', label: 'Imagen' },
    { v: 'ARCHIVO', icon: '📁', label: 'Archivo' },
  ];

  const handleCrear = async () => {
    if (!url.trim()) {
      Alert.alert('Atención', 'La URL es obligatoria'); return;
    }
    setSaving(true);
    try {
      await recursosService.crearRecurso({
        titulo: nombre.trim() || 'Sin título',
        contenido: url.trim(),
        tipo,
        grupoId,
        metadata: { etiquetas: etiquetas.split(',').map(t => t.trim()).filter(Boolean) },
      });
      showToast.success('Recurso publicado');
      navigation.navigate('DetalleGrupo', { grupoId, refresh: Date.now() });
    } catch {
      Alert.alert('Error', 'No se pudo publicar el recurso. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compartir Recurso</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ gap: 8, paddingBottom: 40 }}>
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.typeGrid}>
          {tipos.map(opt => (
            <TouchableOpacity
              key={opt.v}
              style={[styles.typeBtn, tipo === opt.v && styles.typeBtnActive]}
              onPress={() => setTipo(opt.v)}
            >
              <Text style={styles.typeBtnIcon}>{opt.icon}</Text>
              <Text style={[styles.typeBtnLabel, tipo === opt.v && styles.typeBtnLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Nombre del recurso *</Text>
        <TextInput
          style={styles.input}
          placeholder="ej: Clase 3 - Derivadas"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>URL *</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.hint}>Se extraerá la vista previa automáticamente.</Text>

        <Text style={styles.label}>Etiquetas (separadas por coma)</Text>
        <TextInput
          style={styles.input}
          placeholder="ej: parcial, semana 5"
          value={etiquetas}
          onChangeText={setEtiquetas}
        />

        <TouchableOpacity
          style={[styles.submitBtn, saving && { opacity: 0.7 }]}
          onPress={handleCrear}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}> Publicar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1e293b',
  },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    width: '48%', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: 12, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#fff',
  },
  typeBtnActive: { borderColor: '#6366f1', backgroundColor: '#f5f3ff' },
  typeBtnIcon: { fontSize: 24 },
  typeBtnLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  typeBtnLabelActive: { color: '#6366f1' },
  submitBtn: {
    backgroundColor: '#6366f1', borderRadius: 10, padding: 14,
    alignItems: 'center', marginTop: 24, marginBottom: 20,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
