import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import {
  sesionService,
  FrecuenciaRecurrencia,
} from '../services/sesion.service';
import { showToast } from '../utils/toast';
import theme from '../styles/theme';
import { gruposService } from '../services/grupos.service';

type RootStackParamList = {
  CrearSerie: undefined;
  SesionesEstudio: { refresh?: number } | undefined;
};
type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CrearSerie'>;
};

type PickerTarget = 'inicio' | 'fin' | null;

function fmtFecha(d: Date) {
  return d.toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function CrearSerieScreen({ navigation }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [frecuencia, setFrecuencia] = useState<FrecuenciaRecurrencia>('SEMANAL');
  const [dateInicio, setDateInicio] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [dateFin, setDateFin] = useState<Date>(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000));
  const [recordatorio, setRecordatorio] = useState('30');
  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState<any[]>([]);
  const [enviando, setEnviando] = useState(false);

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  useEffect(() => {
    gruposService.getGrupos().then(setGrupos).catch(() => {});
  }, []);

  const abrirPicker = (target: PickerTarget) => {
    const current = target === 'inicio' ? dateInicio : dateFin;
    setTempDate(current);
    setPickerTarget(target);
    setPickerMode('date');
  };

  const onPickerChange = (_event: unknown, selected?: Date) => {
    if (!selected) { setPickerTarget(null); return; }
    if (Platform.OS === 'android') {
      if (pickerMode === 'date') { setTempDate(selected); setPickerMode('time'); }
      else { applyDate(selected); }
    } else { setTempDate(selected); }
  };

  const applyDate = (date: Date) => {
    if (pickerTarget === 'inicio') setDateInicio(date);
    else setDateFin(date);
    setPickerTarget(null);
  };

  const handleCrear = async () => {
    if (!titulo.trim() || !descripcion.trim() || !lugar.trim()) {
      showToast.error('Completa los campos obligatorios'); return;
    }
    if (dateFin <= dateInicio) { showToast.error('La fecha fin debe ser posterior'); return; }
    setEnviando(true);
    try {
      await sesionService.crearSerie({
        titulo: titulo.trim(), descripcion: descripcion.trim(), lugar: lugar.trim(),
        frecuencia,
        fechaInicio: dateInicio.toISOString(), fechaFin: dateFin.toISOString(),
        recordatorioMinutos: parseInt(recordatorio, 10) || 30,
        ...(grupoId ? { grupoId } : {}),
      });
      showToast.success('Serie creada');
      navigation.navigate('SesionesEstudio', { refresh: Date.now() });
    } catch (e: any) {
      showToast.error(e?.message || 'Error al crear');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={est.container}>
      <View style={est.header}>
        <Pressable onPress={() => navigation.goBack()} style={est.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
        </Pressable>
        <Text style={est.headerTitle}>Nueva serie de sesiones</Text>
      </View>

      <ScrollView style={est.body} contentContainerStyle={{ gap: 8, paddingBottom: 40 }}>
        <TextInput style={est.input} placeholder="Titulo *" value={titulo} onChangeText={setTitulo} />
        <TextInput style={est.input} placeholder="Descripcion *" value={descripcion} onChangeText={setDescripcion} />
        <TextInput style={est.input} placeholder="Lugar *" value={lugar} onChangeText={setLugar} />

        <Text style={est.label}>Frecuencia</Text>
        <View style={est.chipRow}>
          {(['DIARIA', 'SEMANAL', 'QUINCENAL'] as FrecuenciaRecurrencia[]).map((f) => (
            <Pressable
              key={f}
              style={[est.chip, frecuencia === f && est.chipActive]}
              onPress={() => setFrecuencia(f)}
            >
              <Text style={[est.chipText, frecuencia === f && est.chipTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={est.label}>Fecha inicio</Text>
        <Pressable style={est.dateBtn} onPress={() => abrirPicker('inicio')}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
          <Text style={est.dateBtnText}>{fmtFecha(dateInicio)}</Text>
        </Pressable>

        <Text style={est.label}>Fecha fin</Text>
        <Pressable style={est.dateBtn} onPress={() => abrirPicker('fin')}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
          <Text style={est.dateBtnText}>{fmtFecha(dateFin)}</Text>
        </Pressable>

        <Text style={est.label}>Recordatorio (minutos)</Text>
        <TextInput style={est.input} placeholder="30" keyboardType="numeric" value={recordatorio} onChangeText={setRecordatorio} />

        <Text style={est.label}>Grupo (opcional)</Text>
        <View style={est.chipRow}>
          <Pressable style={[est.chip, !grupoId && est.chipActive]} onPress={() => setGrupoId('')}>
            <Text style={[est.chipText, !grupoId && est.chipTextActive]}>Sin grupo</Text>
          </Pressable>
          {grupos.map((g: any) => (
            <Pressable
              key={g.id}
              style={[est.chip, grupoId === g.id && est.chipActive]}
              onPress={() => setGrupoId(g.id)}
            >
              <Text style={[est.chipText, grupoId === g.id && est.chipTextActive]}>{g.nombre}</Text>
            </Pressable>
          ))}
        </View>
        {grupoId ? <Text style={est.grupoInfo}>Se notificara a los miembros</Text> : null}

        <View style={est.modalBtns}>
          <Pressable style={est.btnSecondary} onPress={() => navigation.goBack()}>
            <Text>Cancelar</Text>
          </Pressable>
          <Pressable style={est.btnPrimary} onPress={handleCrear} disabled={enviando}>
            <Text style={est.btnPrimaryText}>{enviando ? 'Creando...' : 'Crear serie'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {Platform.OS === 'ios' && pickerTarget !== null && (
        <View style={est.pickerOverlay}>
          <View style={est.pickerContainer}>
            <Text style={est.modalTitle}>
              {pickerTarget === 'inicio' ? 'Fecha inicio' : 'Fecha fin'}
            </Text>
            <DateTimePicker
              value={tempDate} mode="datetime" display="spinner"
              onChange={onPickerChange} locale="es-CO" minimumDate={new Date()}
            />
            <View style={est.modalBtns}>
              <Pressable style={est.btnSecondary} onPress={() => setPickerTarget(null)}>
                <Text>Cancelar</Text>
              </Pressable>
              <Pressable style={est.btnPrimary} onPress={() => applyDate(tempDate)}>
                <Text style={est.btnPrimaryText}>Listo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {Platform.OS === 'android' && pickerTarget !== null && (
        <DateTimePicker
          value={tempDate} mode={pickerMode} display="default"
          onChange={onPickerChange} minimumDate={new Date()}
        />
      )}
    </View>
  );
}

const est = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    paddingTop: (StatusBar.currentHeight || 24) + 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
  },
  backBtn: { marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  body: { flex: 1, padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 4 },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1,
    borderColor: theme.colors.primary, borderRadius: 8, padding: 10, marginBottom: 4, backgroundColor: '#f0f6ff',
  },
  dateBtnText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: '#e8f0fe' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: theme.colors.primary, fontWeight: '600' },
  grupoInfo: { fontSize: 12, color: '#6c3483', marginBottom: 8 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 8 },
  btnSecondary: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  btnPrimary: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
  pickerOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#003e70' },
});
