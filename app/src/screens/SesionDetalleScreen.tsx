import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  sesionService,
  CalendarioSesionDTO,
  FrecuenciaRecurrencia,
  EstadoAsistencia,
} from '../services/sesion.service';
import { authService } from '../services/auth.service';
import { showToast } from '../utils/toast';
import theme from '../styles/theme';

type RootStackParamList = {
  SesionDetalle: { sesionId: string };
};
type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'SesionDetalle'>;
  route: RouteProp<RootStackParamList, 'SesionDetalle'>;
};

const RECURRENCIA_LABEL: Record<FrecuenciaRecurrencia, string> = { DIARIA: 'Diaria', SEMANAL: 'Semanal', QUINCENAL: 'Quincenal' };
const ASISTENCIA_LABEL: Record<EstadoAsistencia, string> = { PENDIENTE: '⏳ Pendiente', CONFIRMADA: '✅ Confirmada', DECLINADA: '❌ Declinada' };

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SesionDetalleScreen({ navigation, route }: Props) {
  const { sesionId } = route.params;
  const [detalle, setDetalle] = useState<CalendarioSesionDTO | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const [d, uid] = await Promise.all([
        sesionService.obtenerDetalle(sesionId),
        authService.obtenerIdUsuarioActual(),
      ]);
      setDetalle(d);
      setCurrentUserId(uid);
    } catch { showToast.error('Error al cargar detalle'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, [sesionId]);

  const handleAsistir = async () => {
    if (!detalle) return;
    setEnviando(true);
    try {
      await sesionService.confirmarAsistencia(detalle.id);
      const updated = await sesionService.obtenerDetalle(detalle.id);
      setDetalle(updated);
      showToast.success('Asistencia confirmada');
    } catch (e: any) {
      if (e?.message?.includes('409') || e?.message?.includes('ya registraste')) {
        showToast.info('Ya registraste esta respuesta');
      } else {
        showToast.error(e?.message || 'Error al confirmar');
      }
    } finally { setEnviando(false); }
  };

  const handleDeclinar = async () => {
    if (!detalle) return;
    setEnviando(true);
    try {
      await sesionService.declinarAsistencia(detalle.id);
      const updated = await sesionService.obtenerDetalle(detalle.id);
      setDetalle(updated);
      showToast.success('Asistencia declinada');
    } catch { showToast.error('Error al declinar'); }
    finally { setEnviando(false); }
  };

  if (cargando) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
          </Pressable>
          <Text style={s.headerTitle}>Detalle</Text>
        </View>
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      </View>
    );
  }

  if (!detalle) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
          </Pressable>
          <Text style={s.headerTitle}>Detalle</Text>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 40, color: '#999' }}>No se pudo cargar la sesión</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{detalle.titulo}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {detalle.cancelada && (
          <View style={s.cancelBadge}>
            <Text style={s.cancelBadgeText}>🚫 Esta sesión fue cancelada</Text>
          </View>
        )}

        <View style={s.infoGrid}>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>Fecha</Text>
            <Text style={s.infoValue}>{fmtDateTime(detalle.fecha)}</Text>
          </View>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>Lugar</Text>
            <Text style={s.infoValue}>📍 {detalle.lugar}</Text>
          </View>
          {detalle.recurrencia && (
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Recurrencia</Text>
              <Text style={s.infoValue}>🔄 {RECURRENCIA_LABEL[detalle.recurrencia]}</Text>
            </View>
          )}
          {detalle.grupoNombre && (
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Grupo</Text>
              <Text style={s.infoValue}>👥 {detalle.grupoNombre}</Text>
            </View>
          )}
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>Recordatorio</Text>
            <Text style={s.infoValue}>⏰ {detalle.recordatorioMinutos} min antes</Text>
          </View>
        </View>

        {detalle.descripcion ? (
          <View>
            <Text style={s.sectionTitle}>Descripción</Text>
            <Text style={s.descText}>{detalle.descripcion}</Text>
          </View>
        ) : null}

        <View>
          <Text style={s.sectionTitle}>Participantes ({detalle.asistentes.length})</Text>
          {detalle.asistentes.map((a) => (
            <View key={a.id} style={s.asistenteRow}>
              <Text style={s.asistenteNombre}>{a.nombre} {a.apellido}</Text>
              <View style={[
                s.estadoBadge,
                a.estado === 'CONFIRMADA' ? s.estadoConfirmada :
                a.estado === 'DECLINADA' ? s.estadoDeclinada : s.estadoPendiente,
              ]}>
                <Text style={[
                  s.estadoText,
                  a.estado === 'CONFIRMADA' ? { color: '#27ae60' } :
                  a.estado === 'DECLINADA' ? { color: '#e74c3c' } : { color: '#f39c12' },
                ]}>
                  {ASISTENCIA_LABEL[a.estado]}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {!detalle.cancelada && currentUserId && detalle.asistentes.some((a) => a.usuarioId === currentUserId) && (
          <View style={s.actionRow}>
            {detalle.miAsistencia !== 'CONFIRMADA' && (
              <Pressable style={s.btnConfirm} onPress={handleAsistir} disabled={enviando}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={s.btnText}>Asistiré</Text>
              </Pressable>
            )}
            {detalle.miAsistencia !== 'DECLINADA' && (
              <Pressable style={s.btnDecline} onPress={handleDeclinar} disabled={enviando}>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={s.btnText}>No podré asistir</Text>
              </Pressable>
            )}
          </View>
        )}

        {detalle.miAsistencia && (
          <Text style={s.asistenciaActual}>
            Estado actual: {ASISTENCIA_LABEL[detalle.miAsistencia]}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  cancelBadge: { backgroundColor: '#fde8e8', borderRadius: 8, padding: 10 },
  cancelBadgeText: { color: '#c0392b', fontWeight: '700', textAlign: 'center' },
  infoGrid: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 10 },
  infoItem: {},
  infoLabel: { fontSize: 12, fontWeight: '600', color: '#8899aa', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1a2a3a' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#003e70', marginBottom: 8 },
  descText: { fontSize: 14, color: '#445566', lineHeight: 20 },
  asistenteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f4f8' },
  asistenteNombre: { fontSize: 14, color: '#1a2a3a' },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  estadoConfirmada: { backgroundColor: '#e8f8f0' },
  estadoDeclinada: { backgroundColor: '#fde8e8' },
  estadoPendiente: { backgroundColor: '#fef9e7' },
  estadoText: { fontSize: 11, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnConfirm: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#27ae60', borderRadius: 10, padding: 14 },
  btnDecline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#e74c3c', borderRadius: 10, padding: 14 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  asistenciaActual: { textAlign: 'center', fontSize: 12, color: '#8899aa', marginTop: 4 },
});
