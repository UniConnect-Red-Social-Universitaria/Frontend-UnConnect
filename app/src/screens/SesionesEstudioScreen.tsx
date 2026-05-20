import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import {
  sesionService,
  CalendarioSesionDTO,
  FrecuenciaRecurrencia,
  EstadoAsistencia,
} from '../services/sesion.service';
import { showToast } from '../utils/toast';
import theme from '../styles/theme';
import { gruposService } from '../services/grupos.service';

type RootStackParamList = {
  SesionesEstudio: undefined;
  SesionDetalle: { sesionId: string };
};
type Props = { navigation: StackNavigationProp<RootStackParamList, 'SesionesEstudio'> };

type ModalTipo = 'crear' | 'cancelar-una' | 'cancelar-multi' | null;
type PickerTarget = 'inicio' | 'fin' | null;

const RECURRENCIA_LABEL: Record<FrecuenciaRecurrencia, string> = {
  DIARIA: 'Diaria', SEMANAL: 'Semanal', QUINCENAL: 'Quincenal',
};
const ASISTENCIA_LABEL: Record<EstadoAsistencia, string> = {
  PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', DECLINADA: 'Declinada',
};

function fmtFecha(d: Date) {
  return d.toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
function fmtDay(d: Date) {
  return d.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function SesionesEstudioScreen({ navigation }: Props) {
  const [calendario, setCalendario] = useState<CalendarioSesionDTO[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState<ModalTipo>(null);
  const [sesionActual, setSesionActual] = useState<CalendarioSesionDTO | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [multiMode, setMultiMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [frecuencia, setFrecuencia] = useState<FrecuenciaRecurrencia>('SEMANAL');
  const [dateInicio, setDateInicio] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [dateFin, setDateFin] = useState<Date>(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000));
  const [recordatorio, setRecordatorio] = useState('30');
  const [grupoId, setGrupoId] = useState('');

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [cal, grp] = await Promise.all([
        sesionService.obtenerCalendario(),
        gruposService.getGrupos(),
      ]);
      setCalendario(cal);
      setGrupos(grp);
    } catch {
      showToast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const days = useMemo(() => {
    const map = new Map<string, CalendarioSesionDTO[]>();
    const sorted = [...calendario].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    for (const ses of sorted) {
      const d = new Date(ses.fecha);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ses);
    }
    return Array.from(map.entries()).map(([, sessions]) => ({
      date: new Date(sessions[0].fecha),
      sessions,
    }));
  }, [calendario]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const abrirCrear = () => {
    setTitulo(''); setDescripcion(''); setLugar('');
    setFrecuencia('SEMANAL');
    setDateInicio(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setDateFin(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000));
    setRecordatorio('30'); setGrupoId('');
    setModal('crear');
  };

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
      setModal(null);
      showToast.success('Serie creada');
      cargar();
    } catch (e: any) {
      showToast.error(e?.message || 'Error al crear');
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelarUna = async () => {
    if (!sesionActual) return;
    setEnviando(true);
    try {
      await sesionService.cancelarSesion(sesionActual.id, 'solo_esta');
      setModal(null);
      showToast.success('Sesión cancelada');
      cargar();
    } catch {
      showToast.error('Error al cancelar');
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelarMulti = async () => {
    if (!selectedIds.size) return;
    setEnviando(true);
    try {
      const res = await sesionService.cancelarMultiples(Array.from(selectedIds));
      setModal(null); setSelectedIds(new Set()); setMultiMode(false);
      showToast.success(`${res.canceladas} sesion(es) cancelada(s)`);
      cargar();
    } catch {
      showToast.error('Error al cancelar');
    } finally {
      setEnviando(false);
    }
  };

  const confirmCancelarMulti = () => {
    if (!selectedIds.size) { showToast.info('Selecciona al menos una sesion'); return; }
    Alert.alert(
      'Cancelar sesiones',
      `Cancelar ${selectedIds.size} sesion(es)? Esta accion no se puede deshacer.`,
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cancelar', style: 'destructive', onPress: handleCancelarMulti },
      ]
    );
  };

  const renderSession = (ses: CalendarioSesionDTO) => (
    <Pressable
      key={ses.id}
      style={[est.card, ses.cancelada && est.cardCancelada]}
      onPress={() => !multiMode && navigation.navigate('SesionDetalle', { sesionId: ses.id })}
    >
      <View style={est.cardRow}>
        {multiMode && !ses.cancelada && (
          <Pressable style={est.checkbox} onPress={() => toggleSelect(ses.id)}>
            <Ionicons
              name={selectedIds.has(ses.id) ? 'checkbox' : 'square-outline'}
              size={22}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={est.cardTime}>{fmtTime(ses.fecha)}</Text>
            {ses.cancelada && <Text style={est.badgeCancelada}>Cancelada</Text>}
          </View>
          <Text style={[est.cardTitle, ses.cancelada && est.textTachado]}>{ses.titulo}</Text>
          <Text style={est.cardLugar}> {ses.lugar}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {ses.recurrencia && (
              <Text style={est.chipSmall}>
                {ses.recurrencia === 'DIARIA' ? 'Diaria' : ses.recurrencia === 'SEMANAL' ? 'Semanal' : 'Quincenal'}
              </Text>
            )}
            {ses.grupoNombre && <Text style={[est.chipSmall, { backgroundColor: '#f0e6ff' }]}>{ses.grupoNombre}</Text>}
            {ses.miAsistencia && (
              <Text
                style={[
                  est.chipSmall,
                  ses.miAsistencia === 'CONFIRMADA'
                    ? { backgroundColor: '#e8f8f0' }
                    : ses.miAsistencia === 'DECLINADA'
                    ? { backgroundColor: '#fde8e8' }
                    : { backgroundColor: '#fef9e7' },
                ]}
              >
                {ASISTENCIA_LABEL[ses.miAsistencia]}
              </Text>
            )}
          </View>
        </View>
        {!multiMode && !ses.cancelada && (
          <Pressable
            style={est.btnCancelSmall}
            onPress={() => { setSesionActual(ses); setModal('cancelar-una'); }}
          >
            <Ionicons name="close-circle-outline" size={20} color="#c0392b" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={est.container}>
      <View style={est.header}>
        <Pressable onPress={() => navigation.goBack()} style={est.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
        </Pressable>
        <Text style={est.headerTitle}>Sesiones de Estudio</Text>
        <Pressable onPress={abrirCrear} style={est.addBtn}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </Pressable>
      </View>

      <View style={est.toolbar}>
        <Pressable
          style={[est.toolBtn, multiMode && est.toolBtnActive]}
          onPress={() => { setMultiMode(!multiMode); setSelectedIds(new Set()); }}
        >
          <Text style={[est.toolBtnText, multiMode && est.toolBtnTextActive]}>
            {multiMode ? 'Salir' : 'Seleccionar'}
          </Text>
        </Pressable>
        {multiMode && selectedIds.size > 0 && (
          <Pressable style={[est.toolBtn, { backgroundColor: '#c0392b' }]} onPress={confirmCancelarMulti}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
              Cancelar ({selectedIds.size})
            </Text>
          </Pressable>
        )}
      </View>

      {cargando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.date.toISOString()}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>
              No tienes sesiones programadas.
            </Text>
          }
          renderItem={({ item }) => (
            <View>
              <Text style={est.dayHeader}>
                {fmtDay(item.date)}
              </Text>
              {item.sessions.map(renderSession)}
            </View>
          )}
        />
      )}

      <Modal visible={modal === 'crear'} transparent animationType="slide">
        <View style={est.overlay}>
          <ScrollView style={est.modal} contentContainerStyle={{ gap: 8 }}>
            <Text style={est.modalTitle}>Nueva serie de sesiones</Text>
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
              <Pressable style={est.btnSecondary} onPress={() => setModal(null)}>
                <Text>Cancelar</Text>
              </Pressable>
              <Pressable style={est.btnPrimary} onPress={handleCrear} disabled={enviando}>
                <Text style={est.btnPrimaryText}>{enviando ? 'Creando...' : 'Crear serie'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {Platform.OS === 'ios' && pickerTarget !== null && (
        <Modal visible transparent animationType="slide">
          <View style={est.overlay}>
            <View style={[est.modal, { paddingBottom: 24 }]}>
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
        </Modal>
      )}

      {Platform.OS === 'android' && pickerTarget !== null && (
        <DateTimePicker
          value={tempDate} mode={pickerMode} display="default"
          onChange={onPickerChange} minimumDate={new Date()}
        />
      )}

      <Modal visible={modal === 'cancelar-una'} transparent animationType="slide">
        <View style={est.overlay}>
          <View style={est.modal}>
            <Text style={est.modalTitle}>Cancelar sesion</Text>
            <Text style={{ color: '#555', marginBottom: 12 }}>
              Cancelar &quot;{sesionActual?.titulo}&quot;? Esta accion no se puede deshacer.
            </Text>
            <View style={est.modalBtns}>
              <Pressable style={est.btnSecondary} onPress={() => setModal(null)}>
                <Text>Volver</Text>
              </Pressable>
              <Pressable
                style={[est.btnPrimary, { backgroundColor: '#c0392b' }]}
                onPress={handleCancelarUna}
                disabled={enviando}
              >
                <Text style={est.btnPrimaryText}>{enviando ? 'Cancelando...' : 'Cancelar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const est = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
  },
  backBtn: { marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  addBtn: { marginLeft: 8 },
  toolbar: {
    flexDirection: 'row', gap: 8, padding: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
  },
  toolBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: '#dde4ec',
  },
  toolBtnActive: { backgroundColor: '#e8f0fe', borderColor: theme.colors.primary },
  toolBtnText: { fontSize: 13, color: '#556677' },
  toolBtnTextActive: { color: theme.colors.primary, fontWeight: '600' },
  dayHeader: {
    fontSize: 14, fontWeight: '700', color: '#003e70', marginBottom: 8, marginTop: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardCancelada: { opacity: 0.5 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTime: { fontSize: 12, fontWeight: '700', color: theme.colors.primary, marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a2a3a' },
  textTachado: { textDecorationLine: 'line-through' },
  cardLugar: { fontSize: 12, color: '#667788', marginTop: 2 },
  badgeCancelada: {
    fontSize: 10, fontWeight: '700', color: '#c0392b', backgroundColor: '#fde8e8',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden',
  },
  chipSmall: {
    fontSize: 10, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, backgroundColor: '#e8f0fe', color: '#003e70', overflow: 'hidden',
  },
  btnCancelSmall: { padding: 4 },
  checkbox: { padding: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#003e70' },
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
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  btnSecondary: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  btnPrimary: { padding: 12, borderRadius: 8, backgroundColor: theme.colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
});
