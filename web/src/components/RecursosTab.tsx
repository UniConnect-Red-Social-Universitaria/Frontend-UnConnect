import React, { useState, useEffect } from 'react';
import { recursosService, type Recurso } from '../services/recursos.service';
import { authService } from '../services/auth.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDomain(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
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

// ─── Card Component ──────────────────────────────────────────────────────────

function RecursoCard({ recurso, currentUserId, onDelete }: { recurso: Recurso, currentUserId: string | null, onDelete: (id: string, e: React.MouseEvent) => void }) {
    const [imgError, setImgError] = useState(false);
    const og = recurso.metadata?.openGraph as Record<string, any>;
    const etiquetas  = recurso.metadata?.etiquetas  || [];
    const domain     = og?.domain || recurso.metadata?.domain || (recurso.contenido ? getDomain(recurso.contenido) : '');
    const resourceType = og?.resourceType || recurso.metadata?.resourceType;
    const cfg = getTypeConfig(recurso.tipo, resourceType);

    const title   = og?.title       || recurso.titulo || domain;
    const desc    = og?.description || '';
    const imgSrc  = !imgError ? og?.image : undefined;
    const favicon = og?.favicon;
    const fecha   = new Date(recurso.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    const href    = recurso.contenido?.startsWith('http') ? recurso.contenido : '#';

    return (
        <a
            href={href}
            target={href !== '#' ? '_blank' : undefined}
            rel="noreferrer"
            className="rc-card"
            onClick={href === '#' ? (e) => e.preventDefault() : undefined}
        >
            {/* Delete button */}
            {currentUserId === recurso.creadorId && (
                <button 
                    className="rc-delete-btn" 
                    title="Eliminar recurso"
                    onClick={(e) => onDelete(recurso.id, e)}
                >
                    ✕
                </button>
            )}

            {/* Image / placeholder */}
            <div className="rc-img-wrap" style={{ background: imgSrc ? '#000' : cfg.bg }}>
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={title}
                        className="rc-img"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="rc-placeholder" style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, #fff 100%)` }}>
                        <span className="rc-placeholder-icon">{cfg.icon}</span>
                        <span className="rc-placeholder-domain">{domain}</span>
                    </div>
                )}
                <span className="rc-type-badge" style={{ background: cfg.accent }}>{cfg.icon} {cfg.label}</span>
            </div>

            {/* Body */}
            <div className="rc-body">
                {/* Domain bar */}
                <div className="rc-domain-row">
                    {favicon ? (
                        <img src={favicon} alt="" className="rc-favicon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                        <span className="rc-favicon-placeholder" style={{ background: cfg.accent }}>{domain[0]?.toUpperCase()}</span>
                    )}
                    <span className="rc-domain">{domain}</span>
                    <span className="rc-arrow">↗</span>
                </div>

                <h4 className="rc-title">{title}</h4>
                {desc && <p className="rc-desc">{desc}</p>}

                {/* Tags */}
                {etiquetas.length > 0 && (
                    <div className="rc-tags">
                        {etiquetas.map((t: string, i: number) => (
                            <span key={i} className="rc-tag" style={{ borderColor: cfg.accent + '55', color: cfg.accent }}>#{t}</span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="rc-footer">
                    <div className="rc-avatar" title={recurso.creador?.nombre}>
                        {recurso.creador?.nombre?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="rc-meta">{recurso.creador?.nombre || 'Usuario'}</span>
                    <span className="rc-dot">·</span>
                    <span className="rc-meta">{fecha}</span>
                </div>
            </div>
        </a>
    );
}

// ─── Main Tab ────────────────────────────────────────────────────────────────

export default function RecursosTab({ grupoId }: { grupoId: string }) {
    const [recursos,   setRecursos]   = useState<Recurso[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
    const [busqueda,   setBusqueda]   = useState('');

    const [modalOpen,  setModalOpen]  = useState(false);
    const [newRecurso, setNewRecurso] = useState({ nombre: '', url: '', tipo: 'VIDEO', etiquetas: '' });
    const [saving,     setSaving]     = useState(false);
    const [userId,     setUserId]     = useState<string | null>(null);

    const cargarRecursos = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await recursosService.getRecursos(grupoId);
            setRecursos(data);
        } catch (e) {
            console.error('Error cargando recursos:', e);
        } finally {
            setLoading(false);
        }
    }, [grupoId]);

    useEffect(() => { 
        const init = async () => {
            await cargarRecursos();
            authService.obtenerIdUsuarioActual().then(id => setUserId(id));
        };
        init();
    }, [cargarRecursos]);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await recursosService.crearRecurso({
                titulo: newRecurso.nombre.trim() || 'Sin título',
                contenido: newRecurso.url.trim(),
                tipo: newRecurso.tipo,
                grupoId,
                metadata: {
                    etiquetas: newRecurso.etiquetas.split(',').map(t => t.trim()).filter(Boolean),
                },
            });
            setModalOpen(false);
            setNewRecurso({ nombre: '', url: '', tipo: 'VIDEO', etiquetas: '' });
            cargarRecursos();
        } catch (err) {
            console.error(err);
            alert('No se pudo publicar el recurso. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const handleEliminar = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('¿Seguro que deseas eliminar este recurso?')) return;
        try {
            await recursosService.eliminarRecurso(id);
            cargarRecursos();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar recurso');
        }
    };

    const recursosFiltrados = recursos.filter(r => {
        const matchTipo = filtroTipo === 'TODOS' || r.tipo === filtroTipo;
        const q = busqueda.toLowerCase();
        const og = r.metadata?.openGraph as Record<string, any>;
        const matchText = !q || [r.titulo, og?.title, og?.domain, r.metadata?.domain]
            .some(s => s?.toLowerCase().includes(q));
        return matchTipo && matchText;
    });

    return (
        <div className="rt-root">
            <style>{CSS}</style>

            {/* Toolbar */}
            <div className="rt-toolbar">
                <input
                    type="text"
                    placeholder="🔍 Buscar recursos..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="rt-search"
                />
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="rt-select">
                    <option value="TODOS">Categoría: Todos</option>
                    <option value="VIDEO">🎬 Video</option>
                    <option value="PDF">📄 PDF</option>
                    <option value="IMAGEN">🖼️ Imagen</option>
                    <option value="ARCHIVO">📁 Archivo</option>
                </select>
                <button className="rt-btn-add" onClick={() => setModalOpen(true)}>
                    <span>＋</span> Agregar
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="rt-skeleton-grid">
                    {[1, 2, 3].map(i => <div key={i} className="rt-skeleton" />)}
                </div>
            ) : recursosFiltrados.length === 0 ? (
                <div className="rt-empty">
                    <span style={{ fontSize: 48 }}>📭</span>
                    <h4>No hay recursos aquí</h4>
                    <p>Sé el primero en compartir un recurso con el grupo.</p>
                </div>
            ) : (
                <div className="rt-grid">
                    {recursosFiltrados.map(r => <RecursoCard key={r.id} recurso={r} currentUserId={userId} onDelete={handleEliminar} />)}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="rt-overlay" onClick={() => setModalOpen(false)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <h3>Compartir Recurso</h3>
                            <button className="rt-modal-close" onClick={() => setModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCrear}>
                            <div className="rt-form-group">
                                <label className="rt-label">Tipo</label>
                                <div className="rt-type-grid">
                                    {[
                                        { v: 'VIDEO',   icon: '🎬', label: 'Video'   },
                                        { v: 'PDF',     icon: '📄', label: 'PDF'     },
                                        { v: 'IMAGEN',  icon: '🖼️', label: 'Imagen'  },
                                        { v: 'ARCHIVO', icon: '📁', label: 'Archivo' },
                                    ].map(opt => (
                                        <button
                                            key={opt.v}
                                            type="button"
                                            className={`rt-type-btn ${newRecurso.tipo === opt.v ? 'active' : ''}`}
                                            onClick={() => setNewRecurso({ ...newRecurso, tipo: opt.v })}
                                        >
                                            <span>{opt.icon}</span>
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rt-form-group">
                                <label className="rt-label">Nombre del recurso *</label>
                                <input
                                    required
                                    type="text"
                                    className="rt-input"
                                    placeholder="ej: Clase 3 – Derivadas parciales"
                                    value={newRecurso.nombre}
                                    onChange={e => setNewRecurso({ ...newRecurso, nombre: e.target.value })}
                                />
                            </div>

                            <div className="rt-form-group">
                                <label className="rt-label">URL *</label>
                                <input
                                    required
                                    type="url"
                                    className="rt-input"
                                    placeholder="https://..."
                                    value={newRecurso.url}
                                    onChange={e => setNewRecurso({ ...newRecurso, url: e.target.value })}
                                />
                                <span className="rt-hint">Se extraerá la vista previa automáticamente.</span>
                            </div>

                            <div className="rt-form-group">
                                <label className="rt-label">Etiquetas <span style={{ fontWeight: 400, color: '#94a3b8' }}>(separadas por coma)</span></label>
                                <input
                                    type="text"
                                    className="rt-input"
                                    placeholder="ej: parcial, semana 5, importante"
                                    value={newRecurso.etiquetas}
                                    onChange={e => setNewRecurso({ ...newRecurso, etiquetas: e.target.value })}
                                />
                            </div>

                            <div className="rt-form-actions">
                                <button type="button" className="rt-btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="rt-btn-submit" disabled={saving}>
                                    {saving ? '⏳ Publicando...' : '🚀 Publicar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.rt-root { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; }

/* Toolbar */
.rt-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
.rt-search { flex: 1; min-width: 180px; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; background: #fff; color: #334155; transition: border-color 0.2s; font-family: inherit; }
.rt-search:focus { border-color: #6366f1; }
.rt-select { padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; background: #fff; color: #334155; cursor: pointer; font-family: inherit; }
.rt-btn-add { display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgb(99 102 241 / 0.35); font-family: inherit; white-space: nowrap; }
.rt-btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgb(99 102 241 / 0.45); }

/* Grid */
.rt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

/* Card */
.rc-card { display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; transition: all 0.22s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 2px 8px rgb(0 0 0 / 0.04); cursor: pointer; }
.rc-card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgb(0 0 0 / 0.1); border-color: #c7d2fe; }

/* Delete Button */
.rc-delete-btn { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%; background: rgba(255, 255, 255, 0.9); border: none; color: #ef4444; font-size: 14px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; opacity: 0; transition: all 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
.rc-delete-btn:hover { background: #ef4444; color: #fff; }
.rc-card:hover .rc-delete-btn { opacity: 1; }

/* Image */
.rc-img-wrap { position: relative; height: 168px; overflow: hidden; background: #f8fafc; flex-shrink: 0; }
.rc-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.rc-card:hover .rc-img { transform: scale(1.04); }
.rc-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
.rc-placeholder-icon { font-size: 44px; line-height: 1; }
.rc-placeholder-domain { font-size: 12px; color: #94a3b8; font-weight: 500; }
.rc-type-badge { position: absolute; top: 10px; left: 10px; background: #6366f1; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.3px; backdrop-filter: blur(4px); }

/* Body */
.rc-body { padding: 14px 16px 16px; display: flex; flex-direction: column; flex: 1; gap: 8px; }
.rc-domain-row { display: flex; align-items: center; gap: 7px; }
.rc-favicon { width: 16px; height: 16px; border-radius: 4px; object-fit: contain; flex-shrink: 0; }
.rc-favicon-placeholder { width: 16px; height: 16px; border-radius: 4px; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; flex-shrink: 0; }
.rc-domain { font-size: 12px; font-weight: 600; color: #64748b; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rc-arrow { font-size: 12px; color: #cbd5e1; }
.rc-title { margin: 0; font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rc-desc { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rc-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
.rc-tag { font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 20px; border: 1.5px solid; background: transparent; }
.rc-footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; gap: 6px; }
.rc-avatar { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
.rc-meta { font-size: 12px; color: #94a3b8; }
.rc-dot { font-size: 12px; color: #cbd5e1; }

/* Skeleton */
.rt-skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.rt-skeleton { height: 280px; border-radius: 14px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Empty */
.rt-empty { text-align: center; padding: 56px 20px; background: #f8fafc; border-radius: 14px; border: 2px dashed #e2e8f0; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.rt-empty h4 { margin: 0; font-size: 17px; color: #475569; }
.rt-empty p  { margin: 0; font-size: 14px; }

/* Modal */
.rt-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.rt-modal { background: #fff; border-radius: 18px; width: 100%; max-width: 500px; box-shadow: 0 24px 48px rgb(0 0 0 / 0.18); overflow: hidden; }
.rt-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 0; }
.rt-modal-header h3 { margin: 0; font-size: 19px; font-weight: 700; color: #0f172a; }
.rt-modal-close { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 13px; color: #64748b; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
.rt-modal-close:hover { background: #e2e8f0; }
.rt-modal form { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 16px; }
.rt-form-group { display: flex; flex-direction: column; gap: 6px; }
.rt-label { font-size: 13px; font-weight: 600; color: #475569; }
.rt-input { padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; color: #1e293b; font-family: inherit; transition: border-color 0.2s; }
.rt-input:focus { border-color: #6366f1; }
.rt-hint { font-size: 11px; color: #94a3b8; margin-top: 2px; }

/* Type picker */
.rt-type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.rt-type-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; border: 2px solid #e2e8f0; border-radius: 10px; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; color: #475569; transition: all 0.15s; font-family: inherit; }
.rt-type-btn span:first-child { font-size: 22px; }
.rt-type-btn:hover { border-color: #6366f1; color: #6366f1; background: #f5f3ff; }
.rt-type-btn.active { border-color: #6366f1; background: #f5f3ff; color: #6366f1; }

/* Actions */
.rt-form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
.rt-btn-cancel { padding: 10px 18px; border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff; color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; }
.rt-btn-cancel:hover { background: #f8fafc; }
.rt-btn-submit { padding: 10px 22px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; box-shadow: 0 4px 14px rgb(99 102 241 / 0.3); }
.rt-btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgb(99 102 241 / 0.4); }
.rt-btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }
`;
