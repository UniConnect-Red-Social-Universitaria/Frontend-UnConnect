import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text as RNText, Pressable, ScrollView, TextInput,
    ActivityIndicator, Modal, useWindowDimensions, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Screen, Text, Title, PrimaryButton } from '@uniconnect/ui';
import { useIsDesktop } from '../hooks/useIsDesktop';
import {
    sprintService, historiaUsuarioService, criterioAceptacionService,
    metricasService, trazabilidadService, retrospectivaService,
    impedimentoService, exportacionService,
} from '../services';
import type {
    Sprint, HistoriaUsuario, HUEstado, CriterioAceptacion,
    MetricasSprint, BurnDownData, CumplimientoSprint, VelocidadHistorica,
    TrazabilidadHU, Retrospectiva, Impedimento, ImpedimentoEstado,
} from '../types/api.types';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { showToast } from '../utils/toast';
import globalStyles from '../styles/global';

type Tab = 'panel' | 'metricas' | 'criterios' | 'trazabilidad' | 'retrospectiva' | 'impedimentos' | 'exportar';

const ESTADO_HU: Record<HUEstado, { label: string; color: string }> = {
    PENDIENTE: { label: 'Pendiente', color: '#7a9ab5' },
    EN_PROGRESO: { label: 'En Progreso', color: '#1a73e8' },
    BLOQUEADA: { label: 'Bloqueada', color: '#c0392b' },
    COMPLETADA: { label: 'Completada', color: '#27ae60' },
    CANCELADA: { label: 'Cancelada', color: '#95a5a6' },
};

const IMP_EST: Record<ImpedimentoEstado, { label: string; color: string }> = {
    ABIERTO: { label: 'Abierto', color: '#e74c3c' },
    EN_PROGRESO: { label: 'En Progreso', color: '#f39c12' },
    RESUELTO: { label: 'Resuelto', color: '#27ae60' },
    CERRADO: { label: 'Cerrado', color: '#7a9ab5' },
};

function fmtDate(fecha?: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

type RootStackParamList = {
    SprintDashboard: { sprintId: string; sprintNombre: string };
    Principal: undefined;
    Grupos: undefined;
    Eventos: undefined;
    Contactos: undefined;
    EditarPerfil: undefined;
    Notificaciones: undefined;
    SesionesEstudio: undefined;
};

export default function SprintDashboardScreen({
    navigation, route,
}: {
    navigation: StackNavigationProp<RootStackParamList, 'SprintDashboard'>;
    route: any;
}) {
    const { sprintId, sprintNombre } = route.params || {};
    const isDesktop = useIsDesktop();
    const { width, height } = useWindowDimensions();
    const [tab, setTab] = useState<Tab>('panel');

    const [sprint, setSprint] = useState<Sprint | null>(null);
    const [historias, setHistorias] = useState<HistoriaUsuario[]>([]);
    const [metricas, setMetricas] = useState<MetricasSprint | null>(null);
    const [burndown, setBurndown] = useState<BurnDownData | null>(null);
    const [cumplimiento, setCumplimiento] = useState<CumplimientoSprint | null>(null);
    const [velocidadHistorica, setVelocidadHistorica] = useState<VelocidadHistorica[]>([]);
    const [trazabilidadMap, setTrazabilidadMap] = useState<Record<string, TrazabilidadHU>>({});
    const [retrospectiva, setRetrospectiva] = useState<Retrospectiva | null>(null);
    const [impedimentos, setImpedimentos] = useState<Impedimento[]>([]);
    const [criteriosMap, setCriteriosMap] = useState<Record<string, CriterioAceptacion[]>>({});
    const [cumplimientoMap, setCumplimientoMap] = useState<Record<string, { cumplidos: number; total: number; porcentaje: number }>>({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [showCrearHU, setShowCrearHU] = useState(false);
    const [showCriteriosHU, setShowCriteriosHU] = useState<HistoriaUsuario | null>(null);
    const [showLinkTrazabilidad, setShowLinkTrazabilidad] = useState<string | null>(null);

    // Forms
    const [huForm, setHuForm] = useState({ codigo: '', titulo: '', descripcion: '', storyPoints: '5', prioridad: '1' });
    const [critForm, setCritForm] = useState('');
    const [trazForm, setTrazForm] = useState({ repositorio: 'BACKEND', shaCommit: '', urlCommit: '', numeroPR: '', urlPR: '', estadoPR: 'MERGED' });

    const cargarTodo = useCallback(async () => {
        if (!sprintId) return;
        setLoading(true);
        setError(null);
        try {
            const [sp, hus, metr, burnd, cumpl, velHist, imped, retro] = await Promise.all([
                sprintService.obtener(sprintId),
                historiaUsuarioService.listarPorSprint(sprintId),
                metricasService.obtenerMetricasSprint(sprintId).catch(() => null),
                metricasService.obtenerBurndown(sprintId).catch(() => null),
                metricasService.obtenerCumplimiento(sprintId).catch(() => null),
                metricasService.velocidadHistorica().catch(() => []),
                impedimentoService.listarPorSprint(sprintId).catch(() => []),
                retrospectivaService.obtener(sprintId).catch(() => null),
            ]);
            setSprint(sp);
            setHistorias(hus);
            setMetricas(metr);
            setBurndown(burnd);
            setCumplimiento(cumpl);
            setVelocidadHistorica(velHist);
            setImpedimentos(imped);
            setRetrospectiva(retro);

            const cMap: Record<string, CriterioAceptacion[]> = {};
            const cuMap: Record<string, { cumplidos: number; total: number; porcentaje: number }> = {};
            const tMap: Record<string, TrazabilidadHU> = {};
            await Promise.all(hus.map(async (hu) => {
                try { cMap[hu.id] = await criterioAceptacionService.listarPorHU(hu.id); } catch { cMap[hu.id] = []; }
                try { cuMap[hu.id] = await criterioAceptacionService.cumplimientoHU(hu.id); } catch { cuMap[hu.id] = { cumplidos: 0, total: 0, porcentaje: 0 }; }
                try { tMap[hu.id] = await trazabilidadService.obtenerPorHU(hu.id); } catch { }
            }));
            setCriteriosMap(cMap);
            setCumplimientoMap(cuMap);
            setTrazabilidadMap(tMap);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [sprintId]);

    useEffect(() => { void cargarTodo(); }, [cargarTodo]);

    const handleCrearHU = async () => {
        if (!sprintId || !huForm.titulo.trim()) return;
        try {
            await historiaUsuarioService.crear(sprintId, {
                codigo: huForm.codigo,
                titulo: huForm.titulo,
                descripcion: huForm.descripcion,
                storyPoints: parseInt(huForm.storyPoints) || 1,
                prioridad: parseInt(huForm.prioridad) || 1,
            });
            showToast.success('HU creada');
            setShowCrearHU(false);
            setHuForm({ codigo: `HU-${(historias.length + 1).toString().padStart(3, '0')}`, titulo: '', descripcion: '', storyPoints: '5', prioridad: '1' });
            await cargarTodo();
        } catch (err: any) { showToast.error(err.message); }
    };

    const handleCambiarEstado = async (huId: string, estado: HUEstado) => {
        try {
            await historiaUsuarioService.cambiarEstado(huId, estado);
            showToast.success('Estado actualizado');
            await cargarTodo();
        } catch (err: any) { showToast.error(err.message); }
    };

    const handleEvaluarCriterio = async (criterioId: string, cumplido: boolean) => {
        try {
            await criterioAceptacionService.evaluar(criterioId, cumplido);
            if (showCriteriosHU) {
                const crits = await criterioAceptacionService.listarPorHU(showCriteriosHU.id);
                setCriteriosMap((p) => ({ ...p, [showCriteriosHU.id]: crits }));
                const c = await criterioAceptacionService.cumplimientoHU(showCriteriosHU.id);
                setCumplimientoMap((p) => ({ ...p, [showCriteriosHU.id]: c }));
            }
        } catch (err: any) { showToast.error(err.message); }
    };

    const handleCrearCriterio = async (huId: string) => {
        if (!critForm.trim()) return;
        try {
            const crits = criteriosMap[huId] || [];
            await criterioAceptacionService.crear(huId, { numero: crits.length + 1, descripcion: critForm });
            setCritForm('');
            const updated = await criterioAceptacionService.listarPorHU(huId);
            setCriteriosMap((p) => ({ ...p, [huId]: updated }));
            showToast.success('Criterio creado');
        } catch (err: any) { showToast.error(err.message); }
    };

    const handleLinkTrazabilidad = async () => {
        if (!showLinkTrazabilidad) return;
        try {
            await trazabilidadService.linkear({
                huId: showLinkTrazabilidad,
                repositorio: trazForm.repositorio as 'BACKEND' | 'FRONTEND',
                nombreRepositorio: trazForm.repositorio,
                shaCommit: trazForm.shaCommit || undefined,
                urlCommit: trazForm.urlCommit || undefined,
                numeroPR: trazForm.numeroPR ? parseInt(trazForm.numeroPR) : undefined,
                urlPR: trazForm.urlPR || undefined,
                estadoPR: trazForm.estadoPR || undefined,
            });
            showToast.success('Trazabilidad vinculada');
            setShowLinkTrazabilidad(null);
            if (showLinkTrazabilidad) {
                try { const t = await trazabilidadService.obtenerPorHU(showLinkTrazabilidad); setTrazabilidadMap((p) => ({ ...p, [showLinkTrazabilidad]: t })); } catch { }
            }
        } catch (err: any) { showToast.error(err.message); }
    };

    const handleCambiarEstadoImp = async (id: string, estado: ImpedimentoEstado) => {
        try {
            await impedimentoService.actualizarEstado(id, estado);
            if (sprintId) setImpedimentos(await impedimentoService.listarPorSprint(sprintId));
        } catch (err: any) { showToast.error(err.message); }
    };

    const KANBAN = ['PENDIENTE', 'EN_PROGRESO', 'BLOQUEADA', 'COMPLETADA'] as HUEstado[];
    const TABS: { id: Tab; label: string; icon: string }[] = [
        { id: 'panel', label: 'Panel', icon: 'grid-outline' },
        { id: 'metricas', label: 'Métricas', icon: 'stats-chart-outline' },
        { id: 'criterios', label: 'Criterios', icon: 'checkmark-circle-outline' },
        { id: 'trazabilidad', label: 'Traza', icon: 'link-outline' },
        { id: 'retrospectiva', label: 'Retro', icon: 'chatbubbles-outline' },
        { id: 'impedimentos', label: 'Bloqueos', icon: 'warning-outline' },
        { id: 'exportar', label: 'Exportar', icon: 'download-outline' },
    ];

    const renderTabBar = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, borderBottomWidth: 1, borderBottomColor: '#e8eef4' }}>
            {TABS.map((t) => (
                <Pressable
                    key={t.id}
                    onPress={() => setTab(t.id)}
                    style={{
                        paddingHorizontal: 14, paddingVertical: 10,
                        borderBottomWidth: 2, borderBottomColor: tab === t.id ? '#003e70' : 'transparent',
                    }}
                >
                    <RNText style={{ fontSize: 13, fontWeight: tab === t.id ? '700' : '500', color: tab === t.id ? '#003e70' : '#4a6a85' }}>
                        {t.label}
                    </RNText>
                </Pressable>
            ))}
        </ScrollView>
    );

    const mainContent = (
        <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8eef4' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pressable onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#003e70" /></Pressable>
                            <Title style={{ fontSize: 18, margin: 0, flex: 1 }}>{sprintNombre || 'Sprint'}</Title>
                </View>
                {sprint && (
                    <RNText style={{ fontSize: 12, color: '#7a9ab5', marginTop: 2 }}>
                        {sprint.velocidadPlaneada} SP · {fmtDate(sprint.fechaInicio)} — {fmtDate(sprint.fechaFin)}
                    </RNText>
                )}
            </View>

            {loading && <ActivityIndicator size="large" color="#003e70" style={{ marginTop: 40 }} />}
            {error && <RNText style={{ color: '#c0392b', padding: 16 }}>{error}</RNText>}

            {!loading && !error && sprint && (
                <>
                    {renderTabBar()}

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
                        {/* ══ PANEL ══ */}
                        {tab === 'panel' && (
                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <RNText style={{ fontWeight: '700', fontSize: 15, color: '#00284d' }}>Historias de Usuario</RNText>
                                    <PrimaryButton onPress={() => setShowCrearHU(true)}><RNText style={{ color: '#fff', fontSize: 12 }}>+ HU</RNText></PrimaryButton>
                                </View>
                                {KANBAN.map((col) => {
                                    const cfg = ESTADO_HU[col];
                                    const colHus = historias.filter((h) => h.estado === col);
                                    return (
                                        <View key={col} style={{ marginBottom: 12 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cfg.color }} />
                                                <RNText style={{ fontWeight: '600', fontSize: 13, color: cfg.color }}>{cfg.label}</RNText>
                                                <RNText style={{ fontSize: 12, color: '#7a9ab5' }}>({colHus.length})</RNText>
                                            </View>
                                            {colHus.map((hu) => {
                                                const cumpl = cumplimientoMap[hu.id];
                                                const traz = trazabilidadMap[hu.id];
                                                return (
                                                    <View key={hu.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#e8eef4' }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                            <RNText style={{ fontSize: 11, fontWeight: '700', color: '#003e70' }}>{hu.codigo}</RNText>
                                                            <RNText style={{ fontSize: 10, color: '#7a9ab5' }}>{hu.storyPoints} SP</RNText>
                                                        </View>
                                                        <RNText style={{ fontSize: 13, fontWeight: '600', color: '#00284d', marginVertical: 2 }}>{hu.titulo}</RNText>
                                                        {cumpl && cumpl.total > 0 && (
                                                            <RNText style={{ fontSize: 10, color: '#7a9ab5' }}>✓ {cumpl.cumplidos}/{cumpl.total}</RNText>
                                                        )}
                                                        {traz?.trazas && traz.trazas.length > 0 && (
                                                            <RNText style={{ fontSize: 10, color: '#1a73e8' }}>🔗 {traz.trazas.length}</RNText>
                                                        )}
                                                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                                                            {col !== 'COMPLETADA' && col !== 'CANCELADA' && (
                                                                KANBAN.filter(c => c !== 'CANCELADA').map((est) => (
                                                                    <Pressable
                                                                        key={est}
                                                                        onPress={() => handleCambiarEstado(hu.id, est)}
                                                                        style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: ESTADO_HU[est].color + '20' }}
                                                                    >
                                                                        <RNText style={{ fontSize: 10, color: ESTADO_HU[est].color }}>{ESTADO_HU[est].label}</RNText>
                                                                    </Pressable>
                                                                ))
                                                            )}
                                                            <Pressable onPress={() => setShowCriteriosHU(hu)}><Ionicons name="checkmark-circle-outline" size={18} color="#7a9ab5" /></Pressable>
                                                            <Pressable onPress={() => setShowLinkTrazabilidad(hu.id)}><Ionicons name="link-outline" size={18} color="#7a9ab5" /></Pressable>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* ══ MÉTRICAS ══ */}
                        {tab === 'metricas' && (
                            <View>
                                <RNText style={{ fontWeight: '700', fontSize: 15, color: '#00284d', marginBottom: 10 }}>Métricas del Sprint</RNText>
                                {metricas && (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                        {[
                                            { label: 'Vel. Planeada', value: `${metricas.velocidadPlaneada} SP` },
                                            { label: 'Vel. Real', value: `${metricas.velocidadReal} SP` },
                                            { label: '% Cumplimiento', value: `${metricas.porcentajeCumplimiento}%` },
                                            { label: 'HU Comp.', value: `${metricas.huCompletadas}/${metricas.huTotales}` },
                                            { label: 'En Progreso', value: `${metricas.huEnProgreso}` },
                                            { label: 'Bloqueadas', value: `${metricas.huBloqueadas}` },
                                        ].map((item) => (
                                            <View key={item.label} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, minWidth: '45%', borderWidth: 1, borderColor: '#e8eef4' }}>
                                                <RNText style={{ fontSize: 11, color: '#7a9ab5' }}>{item.label}</RNText>
                                                <RNText style={{ fontSize: 20, fontWeight: '700', color: '#003e70' }}>{item.value}</RNText>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                {cumplimiento && (
                                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e8eef4' }}>
                                        <RNText style={{ fontWeight: '600', fontSize: 14, color: '#00284d', marginBottom: 4 }}>Cumplimiento de Criterios</RNText>
                                        <RNText style={{ fontSize: 24, fontWeight: '700', color: '#003e70' }}>{Math.round(cumplimiento.porcentajeCumplimiento)}%</RNText>
                                        <RNText style={{ fontSize: 12, color: '#7a9ab5' }}>{cumplimiento.criteriosCumplidos}/{cumplimiento.criteriosTotales} criterios</RNText>
                                    </View>
                                )}
                                {burndown && (
                                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e8eef4' }}>
                                        <RNText style={{ fontWeight: '600', fontSize: 14, color: '#00284d', marginBottom: 8 }}>Burn-Down</RNText>
                                        <RNText style={{ fontSize: 12, color: '#4a6a85' }}>SP planeados: {burndown.totalSpPlaneados}</RNText>
                                        <RNText style={{ fontSize: 12, color: '#4a6a85' }}>SP completados: {burndown.spCompletados}</RNText>
                                        <RNText style={{ fontSize: 12, color: '#4a6a85' }}>Proyección: {burndown.proyeccionFinal} SP restantes</RNText>
                                        <RNText style={{ fontSize: 11, color: '#7a9ab5', marginTop: 8 }}>Días: {burndown.dias.length}</RNText>
                                    </View>
                                )}
                                {velocidadHistorica.length > 0 && (
                                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e8eef4' }}>
                                        <RNText style={{ fontWeight: '600', fontSize: 14, color: '#00284d', marginBottom: 8 }}>Velocidad Histórica</RNText>
                                        {velocidadHistorica.map((v) => (
                                            <View key={v.sprintId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f4f8' }}>
                                                <RNText style={{ fontSize: 12, color: '#4a6a85' }}>Sprint {v.numero}</RNText>
                                                <RNText style={{ fontSize: 12, color: '#003e70', fontWeight: '600' }}>{v.velocidadReal}/{v.velocidadPlaneada} SP</RNText>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ══ CRITERIOS ══ */}
                        {tab === 'criterios' && (
                            <View>
                                <RNText style={{ fontWeight: '700', fontSize: 15, color: '#00284d', marginBottom: 10 }}>Criterios de Aceptación</RNText>
                                {historias.map((hu) => {
                                    const crits = criteriosMap[hu.id] || [];
                                    const cumpl = cumplimientoMap[hu.id];
                                    return (
                                        <View key={hu.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e8eef4' }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <RNText style={{ fontWeight: '700', fontSize: 13, color: '#00284d' }}>{hu.codigo}: {hu.titulo}</RNText>
                                                {cumpl && <RNText style={{ fontSize: 11, color: cumpl.porcentaje >= 100 ? '#27ae60' : '#f39c12' }}>{cumpl.porcentaje}%</RNText>}
                                            </View>
                                            {crits.map((c) => (
                                                <Pressable key={c.id} onPress={() => handleEvaluarCriterio(c.id, !c.cumplido)}
                                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f4f8' }}>
                                                    <Ionicons name={c.cumplido ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={c.cumplido ? '#27ae60' : '#c5d3df'} />
                                                    <RNText style={{ fontSize: 13, color: '#4a6a85', flex: 1 }}>{c.numero}. {c.descripcion}</RNText>
                                                </Pressable>
                                            ))}
                                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                                <TextInput style={{ flex: 1, borderWidth: 1, borderColor: '#c5d3df', borderRadius: 6, padding: 8, fontSize: 12 }} placeholder="Nuevo criterio..." value={critForm} onChangeText={setCritForm} />
                                                <Pressable onPress={() => handleCrearCriterio(hu.id)} style={{ padding: 8 }}><Ionicons name="add-circle" size={24} color="#003e70" /></Pressable>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* ══ TRAZABILIDAD ══ */}
                        {tab === 'trazabilidad' && (
                            <View>
                                <RNText style={{ fontWeight: '700', fontSize: 15, color: '#00284d', marginBottom: 10 }}>Trazabilidad GitHub</RNText>
                                {historias.map((hu) => {
                                    const traz = trazabilidadMap[hu.id];
                                    const items = traz?.trazas || [];
                                    return (
                                        <View key={hu.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e8eef4' }}>
                                            <RNText style={{ fontWeight: '700', fontSize: 13, color: '#00284d', marginBottom: 6 }}>{hu.codigo}: {hu.titulo}</RNText>
                                            {items.length === 0 && <RNText style={{ fontSize: 12, color: '#7a9ab5' }}>Sin enlaces</RNText>}
                                            {items.map((item) => (
                                                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f4f8' }}>
                                                    <RNText style={{ fontWeight: '600', fontSize: 11, color: '#003e70', minWidth: 50 }}>{item.tipoArtefacto}</RNText>
                                                    <RNText style={{ fontSize: 11, color: '#7a9ab5' }}>#{item.referencia}</RNText>
                                                    <RNText style={{ fontSize: 11, color: '#4a6a85', flex: 1 }}>{item.repositorio}</RNText>
                                                    {item.enlace ? (
                                                        <Pressable onPress={() => Linking.openURL(item.enlace)}>
                                                            <Ionicons name="open-outline" size={16} color="#1a73e8" />
                                                        </Pressable>
                                                    ) : null}
                                                </View>
                                            ))}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* ══ RETROSPECTIVA ══ */}
                        {tab === 'retrospectiva' && (
                            <View>
                                <RNText style={{ fontWeight: '700', fontSize: 15, color: '#00284d', marginBottom: 10 }}>Retrospectiva</RNText>
                                {!retrospectiva ? (
                                    <RNText style={{ color: '#7a9ab5' }}>No hay retrospectiva para este sprint.</RNText>
                                ) : (
                                    <View>
                                        <RNText style={{ fontSize: 12, color: '#4a6a85', marginBottom: 12 }}>📅 {fmtDate(retrospectiva.fechaRetrospectiva)}</RNText>
                                        {retrospectiva.comentariosGenerales && (
                                            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e8eef4' }}>
                                                <RNText style={{ fontWeight: '600', fontSize: 13, color: '#00284d', marginBottom: 4 }}>Comentarios</RNText>
                                                <RNText style={{ fontSize: 13, color: '#4a6a85' }}>{retrospectiva.comentariosGenerales}</RNText>
                                            </View>
                                        )}
                                        {retrospectiva.acuerdos.length > 0 && (
                                            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e8eef4' }}>
                                                <RNText style={{ fontWeight: '600', fontSize: 13, color: '#00284d', marginBottom: 6 }}>Acuerdos</RNText>
                                                {retrospectiva.acuerdos.map((a) => (
                                                    <View key={a.id} style={{ paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f4f8' }}>
                                                        <RNText style={{ fontSize: 13, color: '#4a6a85' }}>{a.descripcion}</RNText>
                                                        {a.responsable && <RNText style={{ fontSize: 11, color: '#7a9ab5' }}>👤 {a.responsable}</RNText>}
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                        {retrospectiva.impedimentos.length > 0 && (
                                            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e8eef4' }}>
                                                <RNText style={{ fontWeight: '600', fontSize: 13, color: '#00284d', marginBottom: 6 }}>Impedimentos</RNText>
                                                {retrospectiva.impedimentos.map((imp) => (
                                                    <View key={imp.id} style={{ paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f4f8' }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                            <Ionicons name="warning" size={14} color={imp.impacto === 'Alto' ? '#c0392b' : '#f39c12'} />
                                                            <RNText style={{ fontSize: 13, color: '#4a6a85', flex: 1 }}>{imp.descripcion}</RNText>
                                                            <RNText style={{ fontSize: 11, color: imp.impacto === 'Alto' ? '#c0392b' : '#f39c12', fontWeight: '600' }}>{imp.impacto}</RNText>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ══ IMPEDIMENTOS ══ */}
                        {tab === 'impedimentos' && (
                            <View>
                                <RNText style={{ fontWeight: '700', fontSize: 15, color: '#00284d', marginBottom: 10 }}>Impedimentos</RNText>
                                {impedimentos.length === 0 ? (
                                    <RNText style={{ color: '#7a9ab5' }}>Sin impedimentos.</RNText>
                                ) : (
                                    impedimentos.map((imp) => {
                                        const stCfg = IMP_EST[imp.estado];
                                        return (
                                            <View key={imp.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e8eef4', borderLeftWidth: 4, borderLeftColor: imp.esCritico ? '#c0392b' : stCfg.color }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    {imp.esCritico && <View style={{ backgroundColor: '#c0392b', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}><RNText style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>CRÍTICO</RNText></View>}
                                                    <View style={{ backgroundColor: stCfg.color + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                                                        <RNText style={{ fontSize: 11, color: stCfg.color, fontWeight: '600' }}>{stCfg.label}</RNText>
                                                    </View>
                                                </View>
                                                <RNText style={{ fontSize: 14, fontWeight: '600', color: '#00284d', marginBottom: 4 }}>{imp.descripcion}</RNText>
                                                <RNText style={{ fontSize: 11, color: '#7a9ab5' }}>📅 {fmtDate(imp.fechaApertura)} · ⏱ {imp.diasAbierto} días</RNText>
                                                {imp.responsable && <RNText style={{ fontSize: 11, color: '#7a9ab5' }}>👤 {imp.responsable}</RNText>}
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        )}

                        {/* ══ EXPORTAR ══ */}
                        {tab === 'exportar' && (
                            <View>
                                <RNText style={{ fontWeight: '700', fontSize: 15, color: '#00284d', marginBottom: 12 }}>Exportación</RNText>
                                {(['historias', 'criterios', 'impedimentos'] as const).map((tipo) => (
                                    <Pressable
                                        key={tipo}
                                        onPress={() => sprintId && exportacionService.descargarCSV(sprintId, tipo).catch((e) => showToast.error(e.message))}
                                        style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e8eef4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                    >
                                        <View>
                                            <RNText style={{ fontWeight: '600', fontSize: 14, color: '#00284d' }}>📄 {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</RNText>
                                            <RNText style={{ fontSize: 12, color: '#7a9ab5' }}>Descargar CSV</RNText>
                                        </View>
                                        <Ionicons name="download-outline" size={22} color="#003e70" />
                                    </Pressable>
                                ))}
                                <Pressable
                                    onPress={() => sprintId && exportacionService.descargarPDF(sprintId).catch((e) => showToast.error(e.message))}
                                    style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 2, borderColor: '#003e70', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <View>
                                        <RNText style={{ fontWeight: '700', fontSize: 14, color: '#003e70' }}>📊 Reporte PDF</RNText>
                                        <RNText style={{ fontSize: 12, color: '#7a9ab5' }}>Reporte completo del sprint</RNText>
                                    </View>
                                    <Ionicons name="download-outline" size={22} color="#003e70" />
                                </Pressable>
                            </View>
                        )}
                    </ScrollView>
                </>
            )}
        </View>
    );

    if (isDesktop) {
        return (
            <DesktopSidebar navigation={navigation} activeScreen={null}>
                <Screen style={{ width, height }}>{mainContent}</Screen>
            </DesktopSidebar>
        );
    }

    return <Screen style={{ width, height }}>{mainContent}</Screen>;
}
