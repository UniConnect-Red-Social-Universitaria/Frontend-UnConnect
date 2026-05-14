import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import {
  sesionService,
  SesionDTO,
  FrecuenciaRecurrencia,
  AlcanceModificacion,
} from '../services/sesion.service';
import { showToast } from '../utils/toast';
import theme from '../styles/theme';

type RootStackParamList = { SesionesEstudio: undefined };
type Props = { navigation: StackNavigationProp<RootStackParamList, 'SesionesEstudio'> };

type ModalTipo = 'crear' | 'editar' | 'cancelar' | null;
type PickerTarget = 'inicio' | 'fin' | null;

function fmtFecha(d: Date) {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SesionesEstudioScreen({ navigation }: Props) {
  const [sesiones, setSesiones] = useState<SesionDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState<ModalTipo>(null);
  const [sesionActual, setSesionActual] = useState<SesionDTO | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [alcance, setAlcance] = useState<AlcanceModificacion>('solo_esta');

  // Crear serie
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [frecuencia, setFrecuencia] = useState<FrecuenciaRecurrencia>('SEMANAL');
  const [dateInicio, setDateInicio] = useState<Date>(new Date());
  const [dateFin, setDateFin] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [recordatorio, setRecordatorio] = useState('30');

  // DateTimePicker state
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Editar
  const [editTitulo, setEditTitulo] = useState('');
  const [editLugar, setEditLugar] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await sesionService.obtenerSesiones();
      setSesiones(data);
    } catch {
      showToast.error('Error al cargar sesiones');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirEditar = (s: SesionDTO) => {
    setSesionActual(s);
    setEditTitulo(s.titulo);
    setEditLugar(s.lugar);
    setAlcance('solo_esta');
    setModal('editar');
  };

  const abrirCancelar = (s: SesionDTO) => {
    setSesionActual(s);
    setAlcance('solo_esta');
    setModal('cancelar');
  };

  const abrirPicker = (target: PickerTarget) => {
    const current = target === 'inicio' ? dateInicio : dateFin;
    setTempDate(current);
    setPickerTarget(target);
    setPickerMode('date');
  };

  const onPickerChange = (_event: unknown, selected?: Date) => {
    if (!selected) {
      // Android: dismissed
      setPickerTarget(null);
      return;
    }
    if (Platform.OS === 'android') {
      if (pickerMode === 'date') {
        setTempDate(selected);
        setPickerMode('time');
      } else {
        applyDate(selected);
      }
    } else {
      setTempDate(selected);
    }
  };

  const applyDate = (date: Date) => {
    if (pickerTarget === 'inicio') setDateInicio(date);
    else setDateFin(date);
    setPickerTarget(null);
  };

  const handleCrear = async () => {
    if (!titulo.trim() || !descripcion.trim() || !lugar.trim()) {
      showToast.error('Completa todos los campos');
      return;
    }
    if (dateFin <= dateInicio) {
      showToast.error('La fecha fin debe ser posterior a la fecha inicio');
      return;
    }
    setEnviando(true);
    try {
      await sesionService.crearSerie({
        titulo, descripcion, lugar, frecuencia,
        fechaInicio: dateInicio.toISOString(),
        fechaFin: dateFin.toISOString(),
        recordatorioMinutos: parseInt(recordatorio, 10) || 30,
      });
      setModal(null);
      setTitulo(''); setDescripcion(''); setLugar('');
      setDateInicio(new Date());
      setDateFin(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      showToast.success('Serie creada');
      cargar();
    } catch (e: any) {
      showToast.error(e?.message || 'Error al crear la serie');
    } finally {
      setEnviando(false);
    }
  };

  const handleEditar = async () => {
    if (!sesionActual) return;
    setEnviando(true);
    try {
      await sesionService.modificarSesion(sesionActual.id, alcance, {
        titulo: editTitulo, lugar: editLugar,
      });
      setModal(null);
      showToast.success('Sesión actualizada');
      cargar();
    } catch {
      showToast.error('Error al modificar la sesión');
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelar = async () => {
    if (!sesionActual) return;
    setEnviando(true);
    try {
      await sesionService.cancelarSesion(sesionActual.id, alcance);
      setModal(null);
      showToast.success('Sesión cancelada');
      cargar();
    } catch {
      showToast.error('Error al cancelar la sesión');
    } finally {
      setEnviando(false);
    }
  };

  const FRECUENCIAS: FrecuenciaRecurrencia[] = ['DIARIA', 'SEMANAL', 'QUINCENAL'];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Sesiones de Estudio</Text>
        <Pressable onPress={() => setModal('crear')} style={s.addBtn}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </Pressable>
      </View>

      {cargando ? (
        <ActivityIndicator style={s.loader} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={sesiones}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No tienes sesiones programadas. ¡Crea una serie!</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.cardTitle}>{item.titulo}</Text>
              {item.modificada && <Text style={s.cardModificada}>✎ Modificada</Text>}
              <Text style={s.cardMeta}>
                {new Date(item.fecha).toLocaleDateString('es-CO', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={s.cardLugar}>📍 {item.lugar}</Text>
              <Text style={s.cardMeta}>⏰ Recordatorio: {item.recordatorioMinutos} min antes</Text>
              <View style={s.cardActions}>
                <Pressable style={s.btnEdit} onPress={() => abrirEditar(item)}>
                  <Text style={s.btnEditText}>Editar</Text>
                </Pressable>
                <Pressable style={s.btnCancel} onPress={() => abrirCancelar(item)}>
                  <Text style={s.btnCancelText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal crear */}
      <Modal visible={modal === 'crear'} transparent animationType="slide">
        <View style={s.overlay}>
          <ScrollView style={s.modal} contentContainerStyle={{ gap: 8 }}>
            <Text style={s.modalTitle}>Nueva serie de sesiones</Text>
            <TextInput style={s.input} placeholder="Título" value={titulo} onChangeText={setTitulo} />
            <TextInput style={s.input} placeholder="Descripción" value={descripcion} onChangeText={setDescripcion} />
            <TextInput style={s.input} placeholder="Lugar" value={lugar} onChangeText={setLugar} />
            <Text style={s.label}>Frecuencia</Text>
            <View style={s.chipRow}>
              {FRECUENCIAS.map(f => (
                <Pressable key={f} style={[s.chip, frecuencia === f && s.chipActive]} onPress={() => setFrecuencia(f)}>
                  <Text style={[s.chipText, frecuencia === f && s.chipTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.label}>Fecha inicio</Text>
            <Pressable style={s.dateBtn} onPress={() => abrirPicker('inicio')}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Text style={s.dateBtnText}>{fmtFecha(dateInicio)}</Text>
            </Pressable>

            <Text style={s.label}>Fecha fin de la serie</Text>
            <Pressable style={s.dateBtn} onPress={() => abrirPicker('fin')}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Text style={s.dateBtnText}>{fmtFecha(dateFin)}</Text>
            </Pressable>

            <Text style={s.label}>Recordatorio (minutos antes)</Text>
            <TextInput style={s.input} placeholder="30" keyboardType="numeric" value={recordatorio} onChangeText={setRecordatorio} />

            <View style={s.modalBtns}>
              <Pressable style={s.btnSecondary} onPress={() => setModal(null)}><Text>Cancelar</Text></Pressable>
              <Pressable style={s.btnPrimary} onPress={handleCrear} disabled={enviando}>
                <Text style={s.btnPrimaryText}>{enviando ? 'Creando...' : 'Crear serie'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* iOS date picker modal */}
      {Platform.OS === 'ios' && pickerTarget !== null && (
        <Modal visible transparent animationType="slide">
          <View style={s.overlay}>
            <View style={[s.modal, { paddingBottom: 24 }]}>
              <Text style={s.modalTitle}>
                {pickerTarget === 'inicio' ? 'Fecha inicio' : 'Fecha fin'}
              </Text>
              <DateTimePicker
                value={tempDate}
                mode="datetime"
                display="spinner"
                onValueChange={onPickerChange}
                onDismiss={() => setPickerTarget(null)}
                locale="es-CO"
                minimumDate={new Date()}
              />
              <View style={s.modalBtns}>
                <Pressable style={s.btnSecondary} onPress={() => setPickerTarget(null)}>
                  <Text>Cancelar</Text>
                </Pressable>
                <Pressable style={s.btnPrimary} onPress={() => applyDate(tempDate)}>
                  <Text style={s.btnPrimaryText}>Listo</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android date/time picker (se muestra como diálogo nativo) */}
      {Platform.OS === 'android' && pickerTarget !== null && (
        <DateTimePicker
          value={tempDate}
          mode={pickerMode}
          display="default"
          onValueChange={onPickerChange}
          onDismiss={() => setPickerTarget(null)}
          minimumDate={new Date()}
        />
      )}

      {/* Modal editar */}
      <Modal visible={modal === 'editar'} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Editar sesión</Text>
            <Text style={s.label}>Aplicar a</Text>
            <View style={s.chipRow}>
              {(['solo_esta', 'esta_y_siguientes'] as AlcanceModificacion[]).map(a => (
                <Pressable key={a} style={[s.chip, alcance === a && s.chipActive]} onPress={() => setAlcance(a)}>
                  <Text style={[s.chipText, alcance === a && s.chipTextActive]}>{a === 'solo_esta' ? 'Solo esta' : 'Esta y siguientes'}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={s.input} placeholder="Título" value={editTitulo} onChangeText={setEditTitulo} />
            <TextInput style={s.input} placeholder="Lugar" value={editLugar} onChangeText={setEditLugar} />
            <View style={s.modalBtns}>
              <Pressable style={s.btnSecondary} onPress={() => setModal(null)}><Text>Cancelar</Text></Pressable>
              <Pressable style={s.btnPrimary} onPress={handleEditar} disabled={enviando}>
                <Text style={s.btnPrimaryText}>{enviando ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal cancelar */}
      <Modal visible={modal === 'cancelar'} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Cancelar sesión</Text>
            <Text style={{ color: '#555', marginBottom: 12 }}>¿Qué deseas cancelar?</Text>
            <View style={s.chipRow}>
              {(['solo_esta', 'esta_y_siguientes'] as AlcanceModificacion[]).map(a => (
                <Pressable key={a} style={[s.chip, alcance === a && s.chipActive]} onPress={() => setAlcance(a)}>
                  <Text style={[s.chipText, alcance === a && s.chipTextActive]}>{a === 'solo_esta' ? 'Solo esta' : 'Esta y siguientes'}</Text>
                </Pressable>
              ))}
            </View>
            <View style={s.modalBtns}>
              <Pressable style={s.btnSecondary} onPress={() => setModal(null)}><Text>No cancelar</Text></Pressable>
              <Pressable style={[s.btnPrimary, { backgroundColor: '#c0392b' }]} onPress={handleCancelar} disabled={enviando}>
                <Text style={s.btnPrimaryText}>{enviando ? 'Cancelando...' : 'Confirmar'}</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardModificada: { fontSize: 11, color: '#f39c12', fontWeight: '600', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#999', marginBottom: 2 },
  cardLugar: { fontSize: 13, color: '#555', marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 8 },
  btnEdit: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, backgroundColor: '#e8f0fe' },
  btnEditText: { color: '#003e70', fontWeight: '600', fontSize: 12 },
  btnCancel: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, backgroundColor: '#fde8e8' },
  btnCancelText: { color: '#c0392b', fontWeight: '600', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 4 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 8, padding: 10, marginBottom: 4, backgroundColor: '#f0f6ff' },
  dateBtnText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: '#e8f0fe' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: theme.colors.primary, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  btnSecondary: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  btnPrimary: { padding: 12, borderRadius: 8, backgroundColor: theme.colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
});
