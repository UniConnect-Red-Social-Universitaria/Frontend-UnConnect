import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text as RNText, Pressable, ScrollView, TextInput,
    ActivityIndicator, Modal, useWindowDimensions, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Screen, Text, Title, PrimaryButton } from '@uniconnect/ui';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { sprintService } from '../services';
import { Sprint, SprintEstado } from '../types/api.types';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { showToast } from '../utils/toast';

const ESTADO_CONFIG: Record<SprintEstado, { label: string; color: string }> = {
    PLANEACION: { label: 'Planeación', color: '#f39c12' },
    ACTIVO: { label: 'Activo', color: '#27ae60' },
    COMPLETADO: { label: 'Completado', color: '#003e70' },
    CANCELADO: { label: 'Cancelado', color: '#c0392b' },
};

function fmtDate(fecha?: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

type RootStackParamList = {
    Sprints: undefined;
    SprintDashboard: { sprintId: string; sprintNombre: string };
    Principal: undefined;
    Grupos: undefined;
    Eventos: undefined;
    Contactos: undefined;
    EditarPerfil: undefined;
    Notificaciones: undefined;
    SesionesEstudio: undefined;
};

type SprintsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Sprints'>;

export default function SprintsScreen({ navigation }: { navigation: SprintsScreenNavigationProp }) {
    const isDesktop = useIsDesktop();
    const { width, height } = useWindowDimensions();
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<'todos' | 'activos'>('todos');
    const [showCrear, setShowCrear] = useState(false);
    const [creando, setCreando] = useState(false);
    const [form, setForm] = useState({ numero: 1, nombre: '', descripcion: '', velocidadPlaneada: 40 });

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = filtro === 'activos' ? await sprintService.listar(true) : await sprintService.listar();
            setSprints(data);
        } catch (err: any) {
            setError(err.message || 'Error');
        } finally {
            setLoading(false);
        }
    }, [filtro]);

    useEffect(() => { void cargar(); }, [cargar]);

    const handleCrear = async () => {
        if (!form.nombre.trim()) { showToast.error('El nombre es obligatorio'); return; }
        setCreando(true);
        try {
            await sprintService.crear(form);
            showToast.success('Sprint creado');
            setShowCrear(false);
            setForm({ numero: sprints.length + 1, nombre: '', descripcion: '', velocidadPlaneada: 40 });
            await cargar();
        } catch (err: any) {
            showToast.error(err.message || 'Error');
        } finally {
            setCreando(false);
        }
    };

    const handleIniciar = async (id: string) => {
        try { await sprintService.iniciar(id); showToast.success('Sprint iniciado'); await cargar(); } catch (err: any) { showToast.error(err.message); }
    };

    const handleCerrar = async (id: string) => {
        try { await sprintService.cerrar(id); showToast.success('Sprint cerrado'); await cargar(); } catch (err: any) { showToast.error(err.message); }
    };

    const mainContent = (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title style={{ margin: 0 }}>Sprints</Title>
                <PrimaryButton onPress={() => setShowCrear(true)}>
                    <RNText style={{ color: '#fff', fontWeight: '600' }}>+ Nuevo</RNText>
                </PrimaryButton>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {(['todos', 'activos'] as const).map((f) => (
                    <Pressable
                        key={f}
                        onPress={() => setFiltro(f)}
                        style={{
                            paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
                            backgroundColor: filtro === f ? '#003e70' : '#f0f4f8',
                        }}
                    >
                        <RNText style={{ fontSize: 13, fontWeight: '600', color: filtro === f ? '#fff' : '#4a6a85' }}>
                            {f === 'todos' ? 'Todos' : 'Activos'}
                        </RNText>
                    </Pressable>
                ))}
            </View>

            {loading && <ActivityIndicator size="large" color="#003e70" style={{ marginTop: 40 }} />}
            {error && <Text style={{ color: '#c0392b' }}>⚠️ {error}</Text>}

            {!loading && !error && sprints.length === 0 && (
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                    <RNText style={{ fontSize: 44 }}>📋</RNText>
                    <Text style={{ marginTop: 12, color: '#7a9ab5' }}>No hay sprints aún.</Text>
                </View>
            )}

            {!loading && !error && sprints.map((sp) => {
                const cfg = ESTADO_CONFIG[sp.estado];
                return (
                    <Pressable
                        key={sp.id}
                        onPress={() => navigation.navigate('SprintDashboard', { sprintId: sp.id, sprintNombre: sp.nombre })}
                        style={st.card}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                <RNText style={st.cardTitle} numberOfLines={1}>
                                    Sprint {sp.numero}: {sp.nombre}
                                </RNText>
                                <View style={{ backgroundColor: cfg.color + '20', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                                    <RNText style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{cfg.label}</RNText>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {sp.estado === 'PLANEACION' && (
                                    <Pressable onPress={() => handleIniciar(sp.id)} style={{ padding: 6 }}>
                                        <Ionicons name="play" size={18} color="#27ae60" />
                                    </Pressable>
                                )}
                                {sp.estado === 'ACTIVO' && (
                                    <Pressable onPress={() => handleCerrar(sp.id)} style={{ padding: 6 }}>
                                        <Ionicons name="stop" size={18} color="#c0392b" />
                                    </Pressable>
                                )}
                                <Ionicons name="chevron-forward" size={18} color="#7a9ab5" />
                            </View>
                        </View>
                        {sp.descripcion ? <RNText style={st.cardDesc}>{sp.descripcion}</RNText> : null}
                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                            <RNText style={st.cardMeta}>📅 {fmtDate(sp.fechaInicio)} — {fmtDate(sp.fechaFin)}</RNText>
                            <RNText style={st.cardMeta}>⚡ {sp.velocidadPlaneada} SP</RNText>
                        </View>
                    </Pressable>
                );
            })}
        </ScrollView>
    );

    if (isDesktop) {
        return (
            <DesktopSidebar navigation={navigation} activeScreen={null}>
                <Screen style={{ width, height }}>{mainContent}</Screen>
            </DesktopSidebar>
        );
    }

    return (
        <Screen style={{ width, height }}>
            {mainContent}
            <View style={st2.bottomBar}>
                <Pressable style={st2.footerTab} onPress={() => navigation.navigate('Principal')}>
                    <Ionicons name="home-outline" size={24} color="#7a9ab5" />
                </Pressable>
                <Pressable style={st2.footerTab} onPress={() => navigation.navigate('Grupos')}>
                    <Ionicons name="people-outline" size={24} color="#7a9ab5" />
                </Pressable>
                <Pressable style={st2.footerTab} onPress={() => navigation.navigate('Eventos')}>
                    <Ionicons name="calendar-outline" size={24} color="#7a9ab5" />
                </Pressable>
                <Pressable style={st2.footerTab} onPress={() => navigation.navigate('Contactos')}>
                    <Ionicons name="chatbubbles-outline" size={24} color="#7a9ab5" />
                </Pressable>
            </View>

            <Modal visible={showCrear} transparent animationType="slide">
                <View style={st2.modalOverlay}>
                    <View style={st2.modalContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <RNText style={st2.modalTitle}>📋 Nuevo Sprint</RNText>
                            <Pressable onPress={() => setShowCrear(false)}><Ionicons name="close" size={24} color="#7a9ab5" /></Pressable>
                        </View>
                        <RNText style={st2.label}>Número</RNText>
                        <TextInput style={st2.input} keyboardType="numeric" value={String(form.numero)} onChangeText={(v) => setForm({ ...form, numero: parseInt(v) || 1 })} />
                        <RNText style={st2.label}>Nombre</RNText>
                        <TextInput style={st2.input} placeholder="Sprint 1" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} />
                        <RNText style={st2.label}>Descripción</RNText>
                        <TextInput style={[st2.input, { minHeight: 60 }]} multiline placeholder="Objetivos..." value={form.descripcion} onChangeText={(v) => setForm({ ...form, descripcion: v })} />
                        <RNText style={st2.label}>Velocidad Planeada (SP)</RNText>
                        <TextInput style={st2.input} keyboardType="numeric" value={String(form.velocidadPlaneada)} onChangeText={(v) => setForm({ ...form, velocidadPlaneada: parseInt(v) || 1 })} />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                            <Pressable onPress={() => setShowCrear(false)} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                                <RNText style={{ color: '#4a6a85' }}>Cancelar</RNText>
                            </Pressable>
                            <PrimaryButton onPress={handleCrear} disabled={creando}>
                                <RNText style={{ color: '#fff' }}>{creando ? '...' : 'Crear'}</RNText>
                            </PrimaryButton>
                        </View>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const st = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e8eef4' },
    cardTitle: { fontWeight: '700', fontSize: 15, color: '#00284d' },
    cardDesc: { fontSize: 13, color: '#7a9ab5', marginTop: 4 },
    cardMeta: { fontSize: 12, color: '#4a6a85' },
});

const st2 = StyleSheet.create({
    bottomBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e8eef4', backgroundColor: '#fff', paddingVertical: 8 },
    footerTab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#00284d' },
    label: { fontSize: 13, fontWeight: '600', color: '#4a6a85', marginBottom: 4, marginTop: 8 },
    input: { borderWidth: 1, borderColor: '#c5d3df', borderRadius: 8, padding: 10, fontSize: 14, color: '#00284d', backgroundColor: '#fff', marginBottom: 4 },
});
