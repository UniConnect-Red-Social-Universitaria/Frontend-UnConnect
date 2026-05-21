import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Linking, Image, Alert, ScrollView } from 'react-native';
import { recursosService, Recurso } from '../services/recursos.service';
import { authService } from '../services/auth.service';

function getDomain(url: string): string {
    try { return url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, ''); } catch { return url; }
}

function getTypeConfig(tipo: string, resourceType?: string): { icon: string; label: string; accent: string; bg: string } {
    const rt = (resourceType || tipo || '').toLowerCase();
    if (rt === 'video' || tipo === 'VIDEO') return { icon: '🎬', label: 'Video', accent: '#ef4444', bg: '#fef2f2' };
    if (rt === 'pdf'   || tipo === 'PDF')   return { icon: '📄', label: 'PDF',   accent: '#f97316', bg: '#fff7ed' };
    if (rt === 'repo')                       return { icon: '⚙️', label: 'Repositorio', accent: '#8b5cf6', bg: '#f5f3ff' };
    if (rt === 'doc')                        return { icon: '📝', label: 'Documento',   accent: '#3b82f6', bg: '#eff6ff' };
    if (rt === 'ai')                         return { icon: '🤖', label: 'IA',           accent: '#10b981', bg: '#ecfdf5' };
    if (rt === 'image' || tipo === 'IMAGEN') return { icon: '🖼️', label: 'Imagen',       accent: '#ec4899', bg: '#fdf2f8' };
    if (tipo === 'ARCHIVO')                  return { icon: '📁', label: 'Archivo',      accent: '#64748b', bg: '#f8fafc' };
    return { icon: '🔗', label: 'Enlace', accent: '#3b82f6', bg: '#eff6ff' };
}

function RecursoCard({ recurso, currentUserId, onDelete }: { recurso: Recurso, currentUserId: string | null, onDelete: (id: string) => void }) {
    const [imgError, setImgError] = useState(false);
    const og  = recurso.metadata?.openGraph as any;
    const domain = og?.domain || recurso.metadata?.domain || (recurso.contenido ? getDomain(recurso.contenido) : '');
    const cfg = getTypeConfig(recurso.tipo, og?.resourceType || recurso.metadata?.resourceType);
    
    const title = og?.title || recurso.titulo || domain;
    const desc = og?.description || '';
    const imgSrc = !imgError ? og?.image : undefined;
    const fecha = new Date(recurso.createdAt).toLocaleDateString('es-CO');

    const handlePress = () => {
        if (recurso.contenido?.startsWith('http')) {
            Linking.openURL(recurso.contenido);
        }
    };

    const confirmDelete = () => {
        Alert.alert('Eliminar recurso', '¿Seguro que deseas eliminar este recurso?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(recurso.id) }
        ]);
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.9}>
            {currentUserId === recurso.creadorId && (
                <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
            )}

            <View style={[styles.imgWrap, { backgroundColor: imgSrc ? '#000' : cfg.bg }]}>
                {imgSrc ? (
                    <Image source={{ uri: imgSrc }} style={styles.img} onError={() => setImgError(true)} />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderIcon}>{cfg.icon}</Text>
                        <Text style={styles.placeholderDomain}>{domain}</Text>
                    </View>
                )}
                <View style={[styles.typeBadge, { backgroundColor: cfg.accent }]}>
                    <Text style={styles.typeBadgeText}>{cfg.icon} {cfg.label}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.domainRow}>
                    {og?.favicon ? (
                        <Image source={{ uri: og.favicon }} style={styles.favicon} onError={() => {}} />
                    ) : (
                        <View style={[styles.faviconPlaceholder, { backgroundColor: cfg.accent }]}>
                            <Text style={styles.faviconText}>{domain[0]?.toUpperCase()}</Text>
                        </View>
                    )}
                    <Text style={styles.domainText} numberOfLines={1}>{domain}</Text>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
                {!!desc && <Text style={styles.cardDesc} numberOfLines={2}>{desc}</Text>}

                <View style={styles.cardFooter}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{recurso.creador?.nombre?.[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                    <Text style={styles.metaText}>{recurso.creador?.nombre || 'Usuario'} · {fecha}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export function RecursosTab({ grupoId, onPressAgregar }: { grupoId: string; onPressAgregar?: () => void }) {
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('TODOS');

    useEffect(() => {
        cargarRecursos();
        authService.obtenerIdUsuarioActual().then(setUserId);
    }, [grupoId]);

    const cargarRecursos = async () => {
        try {
            setLoading(true);
            const data = await recursosService.getRecursos(grupoId);
            setRecursos(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id: string) => {
        try {
            await recursosService.eliminarRecurso(id);
            cargarRecursos();
        } catch (err) {
            Alert.alert('Error', 'No se pudo eliminar el recurso');
        }
    };

    const recursosFiltrados = recursos.filter(r => {
        const matchTipo = filtroTipo === 'TODOS' || r.tipo === filtroTipo;
        const q = busqueda.toLowerCase();
        const og = r.metadata?.openGraph as any;
        const matchText = !q || [r.titulo, og?.title, og?.domain, r.metadata?.domain]
            .some(s => s?.toLowerCase().includes(q));
        return matchTipo && matchText;
    });

    const filtros = [
        { id: 'TODOS', label: 'Todos' },
        { id: 'VIDEO', label: '🎬 Video' },
        { id: 'PDF', label: '📄 PDF' },
        { id: 'IMAGEN', label: '🖼️ Imagen' },
        { id: 'ARCHIVO', label: '📁 Archivo' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>📚 Biblioteca</Text>
                <TouchableOpacity style={styles.addBtn} onPress={onPressAgregar}>
                    <Text style={styles.addBtnText}>＋ Agregar</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.searchInput}
                placeholder="🔍 Buscar recursos..."
                value={busqueda}
                onChangeText={setBusqueda}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                {filtros.map(f => (
                    <TouchableOpacity
                        key={f.id}
                        style={[styles.filterChip, filtroTipo === f.id && styles.filterChipActive]}
                        onPress={() => setFiltroTipo(f.id)}
                    >
                        <Text style={[styles.filterChipText, filtroTipo === f.id && styles.filterChipTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 20 }} />
            ) : recursosFiltrados.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTitle}>No hay recursos aquí</Text>
                    <Text style={styles.emptyDesc}>
                        {busqueda ? 'No se encontraron resultados.' : 'Sé el primero en compartir un recurso con el grupo.'}
                    </Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {recursosFiltrados.map(r => (
                        <RecursoCard key={r.id} recurso={r} currentUserId={userId} onDelete={handleEliminar} />
                    ))}
                </View>
            )}


        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, fontSize: 14, marginBottom: 12 },
    filtersScroll: { marginBottom: 16 },
    filterChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    filterChipTextActive: { color: '#fff' },
    emptyBox: { backgroundColor: '#f8fafc', padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed' },
    emptyIcon: { fontSize: 32, marginBottom: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#475569' },
    emptyDesc: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
    grid: { gap: 16 },
    card: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', position: 'relative', marginBottom: 16 },
    deleteBtn: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 10, alignItems: 'center', justifyContent: 'center' },
    deleteBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
    imgWrap: { height: 140, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    img: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholder: { alignItems: 'center', justifyContent: 'center' },
    placeholderIcon: { fontSize: 40 },
    placeholderDomain: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 8 },
    typeBadge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    cardBody: { padding: 14 },
    domainRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    favicon: { width: 16, height: 16, borderRadius: 4, marginRight: 6 },
    faviconPlaceholder: { width: 16, height: 16, borderRadius: 4, marginRight: 6, alignItems: 'center', justifyContent: 'center' },
    faviconText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    domainText: { fontSize: 12, color: '#64748b', fontWeight: '600', flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    cardDesc: { fontSize: 13, color: '#64748b', marginBottom: 12 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
    avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
    avatarText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    metaText: { fontSize: 12, color: '#94a3b8' },

});
