import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  Text,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
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

import type { RootStackParamList } from '../navigation/RootNavigator';
import { useIsDesktop } from '../hooks/useIsDesktop';
type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'SesionesEstudio'>;
  route?: any;
};

type ModalTipo = 'cancelar-una' | 'cancelar-multi' | null;

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

export default function SesionesEstudioScreen({ navigation, route }: Props) {
  const isDesktop = useIsDesktop();
  const [calendario, setCalendario] = useState<CalendarioSesionDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState<ModalTipo>(null);
  const [sesionActual, setSesionActual] = useState<CalendarioSesionDTO | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [multiMode, setMultiMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const cal = await sesionService.obtenerCalendario();
      setCalendario(cal);
    } catch {
      showToast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (route?.params?.refresh) {
      cargar();
    }
  }, [route?.params?.refresh]);

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
    navigation.navigate('CrearSerie');
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
          contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 140 }}
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

      {!isDesktop && (
        <View style={est.bottomBar}>
          <Pressable
            style={est.footerTab}
            onPress={() => navigation.navigate('Principal')}
            accessibilityLabel="Inicio"
          >
            <Ionicons name="home-outline" size={24} style={est.footerIcon} />
          </Pressable>

          <Pressable
            style={est.footerTab}
            onPress={() => navigation.navigate('Grupos')}
            accessibilityLabel="Grupos"
          >
            <Ionicons name="people-outline" size={24} style={est.footerIcon} />
          </Pressable>

          <Pressable
            style={est.footerTab}
            onPress={() => navigation.navigate('Eventos')}
            accessibilityLabel="Eventos"
          >
            <Ionicons name="calendar-outline" size={24} style={est.footerIcon} />
          </Pressable>

          <Pressable
            style={[est.footerTab, est.footerTabActive]}
            onPress={() => navigation.navigate('SesionesEstudio')}
            accessibilityLabel="Sesiones"
          >
            <Ionicons name="time" size={24} style={est.footerIcon} />
          </Pressable>

          <Pressable
            style={est.footerTab}
            onPress={() => navigation.navigate('Contactos')}
            accessibilityLabel="Contactos"
          >
            <Ionicons name="chatbubbles-outline" size={24} style={est.footerIcon} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const est = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: theme.colors.primary, paddingVertical: 24, paddingHorizontal: 12,
    borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingBottom: 48, paddingTop: 24,
    width: '100%', alignSelf: 'stretch', minHeight: 80,
  },
  footerTab: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 999,
  },
  footerTabActive: { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  footerIcon: { color: theme.colors.white || '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    paddingTop: (StatusBar.currentHeight || 24) + 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
  },
  backBtn: { marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  addBtn: { marginLeft: 8 },
  toolbar: {
    flexDirection: 'row', gap: 10, padding: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
  },
  toolBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8,
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
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#003e70' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 8 },
  btnSecondary: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  btnPrimary: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
});
