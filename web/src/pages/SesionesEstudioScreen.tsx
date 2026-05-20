import { useState, useEffect, useCallback, useMemo } from 'react';
import { sesionService, CalendarioSesionDTO, FrecuenciaRecurrencia, EstadoAsistencia } from '../services/sesion.service';
import { gruposService } from '../services/grupos.service';
import { useAuth } from '../context/AuthContext';
import type { Grupo } from '../types/api.types';

const CSS = `
.ses-c { max-width: 1100px; margin: 0 auto; padding: 24px 16px; }
.ses-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.ses-hdr-title { font-size: 22px; font-weight: 700; color: #003e70; }
.ses-hdr-actions { display: flex; gap: 8px; align-items: center; }
.ses-btn { background: #003e70; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-weight: 600; font-size: 14px; font-family: inherit; }
.ses-btn:hover { background: #00529a; }
.ses-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ses-btn-sm { font-size: 12px; padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; font-family: inherit; }
.ses-btn-danger { background: #c0392b; color: #fff; }
.ses-btn-danger:hover { background: #e74c3c; }
.ses-btn-outline { background: none; border: 1px solid #dde4ec; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; font-family: inherit; }
.ses-btn-outline:hover { border-color: #003e70; }
.ses-btn-confirm { background: #27ae60; color: #fff; }
.ses-btn-confirm:hover { background: #2ecc71; }
.ses-btn-decline { background: #e74c3c; color: #fff; }
.ses-btn-decline:hover { background: #c0392b; }

.ses-filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.ses-filter-select { padding: 7px 12px; border: 1px solid #dde4ec; border-radius: 8px; font-size: 13px; font-family: inherit; background: #fff; }

.ses-cal { display: flex; flex-direction: column; gap: 16px; }
.ses-cal-week { display: grid; grid-template-columns: 100px 1fr; gap: 8px; background: #fff; border-radius: 12px; border: 1px solid #e8eef4; overflow: hidden; }
.ses-cal-week-label { padding: 14px 12px; font-size: 13px; font-weight: 700; color: #003e70; background: #f0f6ff; border-right: 1px solid #e8eef4; }
.ses-cal-day { padding: 12px; border-bottom: 1px solid #f0f4f8; }
.ses-cal-day:last-child { border-bottom: none; }
.ses-cal-day-header { font-size: 13px; font-weight: 600; color: #445566; margin-bottom: 8px; }
.ses-cal-day-header span { font-weight: 400; color: #8899aa; }
.ses-cal-sessions { display: flex; flex-direction: column; gap: 8px; }

.ses-event { display: flex; gap: 10px; padding: 10px 12px; border-radius: 8px; border: 1px solid #e8eef4; cursor: pointer; transition: all 0.15s; position: relative; }
.ses-event:hover { border-color: #003e70; background: #f8faff; }
.ses-event.cancelada { opacity: 0.55; background: #f9f9f9; }
.ses-event.selected { border-color: #003e70; background: #e8f0fe; }
.ses-event-time { font-size: 12px; font-weight: 600; color: #003e70; min-width: 55px; padding-top: 2px; }
.ses-event-body { flex: 1; }
.ses-event-title { font-size: 14px; font-weight: 600; color: #1a2a3a; }
.ses-event-meta { font-size: 12px; color: #8899aa; margin-top: 2px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.ses-event-badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; }
.ses-badge-cancelada { background: #fde8e8; color: #c0392b; }
.ses-badge-confirmada { background: #e8f8f0; color: #27ae60; }
.ses-badge-declinada { background: #fde8e8; color: #e74c3c; }
.ses-badge-pendiente { background: #fef9e7; color: #f39c12; }
.ses-badge-recurrencia { background: #e8f0fe; color: #003e70; }
.ses-badge-grupo { background: #f0e6ff; color: #6c3483; }

.ses-checkbox { position: absolute; left: -28px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; accent-color: #003e70; }
.ses-multi-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #e8f0fe; border-radius: 8px; margin-bottom: 8px; font-size: 13px; color: #003e70; }
.ses-empty { text-align: center; color: #aaa; padding: 60px 20px; font-size: 15px; }

.ses-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
.ses-modal { background: #fff; border-radius: 16px; padding: 28px; max-width: 600px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
.ses-modal-wide { max-width: 700px; }
.ses-modal-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #003e70; }
.ses-label { font-size: 13px; font-weight: 600; color: #445566; margin-bottom: 4px; display: block; }
.ses-input { width: 100%; padding: 10px 12px; border: 1px solid #dde4ec; border-radius: 8px; font-size: 14px; box-sizing: border-box; margin-bottom: 12px; font-family: inherit; }
.ses-input:focus { outline: none; border-color: #003e70; }
.ses-select { width: 100%; padding: 10px 12px; border: 1px solid #dde4ec; border-radius: 8px; font-size: 14px; box-sizing: border-box; margin-bottom: 12px; background: #fff; font-family: inherit; }
.ses-modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.ses-error { color: #e74c3c; font-size: 13px; margin-bottom: 8px; }
.ses-alcance-group { display: flex; gap: 12px; margin-bottom: 12px; }
.ses-alcance-opt { flex: 1; border: 2px solid #dde4ec; border-radius: 8px; padding: 10px; cursor: pointer; text-align: center; font-size: 13px; transition: all 0.15s; }
.ses-alcance-opt.active { border-color: #003e70; background: #e8f0fe; color: #003e70; font-weight: 600; }
.ses-grupo-info { font-size: 12px; color: #6c3483; margin-bottom: 12px; padding: 8px; background: #f5f0ff; border-radius: 6px; }
.ses-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: #f0f4f8; border-radius: 10px; padding: 3px; }
.ses-tab { flex: 1; padding: 8px 16px; text-align: center; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; background: transparent; font-family: inherit; color: #556677; }
.ses-tab.active { background: #fff; color: #003e70; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.ses-asistentes { list-style: none; padding: 0; margin: 12px 0; }
.ses-asistente { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f4f8; font-size: 14px; }
.ses-asistente:last-child { border-bottom: none; }
.ses-asistente-nombre { display: flex; align-items: center; gap: 8px; }
.ses-asistente-estado { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }

.ses-toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 500; z-index: 999; animation: slideUp 0.3s ease; }
.ses-toast-success { background: #27ae60; }
.ses-toast-error { background: #e74c3c; }
.ses-toast-info { background: #003e70; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;

type ModalType = 'crear' | 'detalle' | 'cancelar-una' | 'cancelar-multi' | 'editar' | null;
type ViewMode = 'calendario' | 'lista';

const RECURRENCIA_ICON: Record<FrecuenciaRecurrencia, string> = {
  DIARIA: '🔁',
  SEMANAL: '📆',
  QUINCENAL: '📅',
};
const RECURRENCIA_LABEL: Record<FrecuenciaRecurrencia, string> = {
  DIARIA: 'Diaria',
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
};
const ASISTENCIA_LABEL: Record<EstadoAsistencia, string> = {
  PENDIENTE: '⏳ Pendiente',
  CONFIRMADA: '✅ Confirmada',
  DECLINADA: '❌ Declinada',
};

function formatDate(d: Date) {
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function groupByWeek(sessions: CalendarioSesionDTO[]): { label: string; days: { date: Date; sessions: CalendarioSesionDTO[] }[] }[] {
  if (!sessions.length) return [];
  const sorted = [...sessions].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const groups: { label: string; days: { date: Date; sessions: CalendarioSesionDTO[] }[] }[] = [];
  let currentWeek: { date: Date; sessions: CalendarioSesionDTO[] }[] = [];
  let weekStart: Date | null = null;

  for (const s of sorted) {
    const d = new Date(s.fecha);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (!weekStart || (dayStart.getTime() - weekStart.getTime()) >= 7 * 86400000) {
      if (currentWeek.length) {
        const start = currentWeek[0].date;
        const end = currentWeek[currentWeek.length - 1].date;
        groups.push({
          label: `${start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          days: currentWeek,
        });
      }
      weekStart = dayStart;
      currentWeek = [];
    }

    const existingDay = currentWeek.find((dd) => isSameDay(dd.date, dayStart));
    if (existingDay) {
      existingDay.sessions.push(s);
    } else {
      currentWeek.push({ date: dayStart, sessions: [s] });
    }
  }
  if (currentWeek.length) {
    const start = currentWeek[0].date;
    const end = currentWeek[currentWeek.length - 1].date;
    groups.push({
      label: `${start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      days: currentWeek,
    });
  }
  return groups;
}

export default function SesionesEstudioScreen() {
  const { userId } = useAuth();
  const [calendario, setCalendario] = useState<CalendarioSesionDTO[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [sesionActual, setSesionActual] = useState<CalendarioSesionDTO | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendario');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiMode, setMultiMode] = useState(false);

  const [filtroGrupo, setFiltroGrupo] = useState<string>('todas');
  const [filtroRecurrencia, setFiltroRecurrencia] = useState<string>('todas');

  // Create form
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [frecuencia, setFrecuencia] = useState<FrecuenciaRecurrencia>('SEMANAL');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [recordatorio, setRecordatorio] = useState(30);
  const [grupoId, setGrupoId] = useState('');

  // Cancel
  const [alcance, setAlcance] = useState<'solo_esta' | 'esta_y_siguientes'>('solo_esta');

  // Detail
  const [detalle, setDetalle] = useState<CalendarioSesionDTO | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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
      showToast('Error al cargar datos', 'error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const sesionesFiltradas = useMemo(() => {
    let items = calendario;
    if (filtroGrupo !== 'todas') {
      items = items.filter((s) => s.grupoId === filtroGrupo);
    }
    if (filtroRecurrencia !== 'todas') {
      items = items.filter((s) => s.recurrencia === filtroRecurrencia);
    }
    return items;
  }, [calendario, filtroGrupo, filtroRecurrencia]);

  const weeks = useMemo(() => groupByWeek(sesionesFiltradas), [sesionesFiltradas]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const abrirDetalle = async (s: CalendarioSesionDTO) => {
    try {
      const d = await sesionService.obtenerDetalle(s.id);
      setDetalle(d);
      setSesionActual(s);
      setModal('detalle');
    } catch {
      showToast('Error al cargar detalle', 'error');
    }
  };

  const abrirCrear = () => {
    setTitulo(''); setDescripcion(''); setLugar(''); setFrecuencia('SEMANAL');
    setFechaInicio(''); setFechaFin(''); setRecordatorio(30); setGrupoId('');
    setError(''); setModal('crear');
  };

  const abrirCancelarUna = (s: CalendarioSesionDTO) => {
    setSesionActual(s); setAlcance('solo_esta'); setError(''); setModal('cancelar-una');
  };

  const abrirCancelarMulti = () => {
    if (!selectedIds.size) { showToast('Selecciona al menos una sesión', 'info'); return; }
    setError(''); setModal('cancelar-multi');
  };

  const handleCrear = async () => {
    if (!titulo.trim() || !descripcion.trim() || !lugar.trim() || !fechaInicio || !fechaFin) {
      setError('Completa todos los campos obligatorios'); return;
    }
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      setError('La fecha fin debe ser posterior a la fecha inicio'); return;
    }
    setEnviando(true); setError('');
    try {
      await sesionService.crearSerie({
        titulo: titulo.trim(), descripcion: descripcion.trim(), lugar: lugar.trim(),
        frecuencia, fechaInicio: new Date(fechaInicio).toISOString(), fechaFin: new Date(fechaFin).toISOString(),
        recordatorioMinutos: recordatorio,
        ...(grupoId ? { grupoId } : {}),
      });
      setModal(null); showToast('Serie creada exitosamente', 'success');
      await cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear la serie');
    } finally { setEnviando(false); }
  };

  const handleCancelarUna = async () => {
    if (!sesionActual) return;
    setEnviando(true); setError('');
    try {
      await sesionService.cancelarSesion(sesionActual.id, alcance);
      setModal(null); showToast('Sesión cancelada', 'success');
      await cargar();
    } catch { setError('Error al cancelar'); } finally { setEnviando(false); }
  };

  const handleCancelarMulti = async () => {
    if (!selectedIds.size) return;
    setEnviando(true); setError('');
    try {
      const res = await sesionService.cancelarMultiples(Array.from(selectedIds));
      setModal(null); setSelectedIds(new Set()); setMultiMode(false);
      showToast(`${res.canceladas} sesión(es) cancelada(s)`, 'success');
      await cargar();
    } catch { setError('Error al cancelar'); } finally { setEnviando(false); }
  };

  const handleAsistir = async () => {
    if (!detalle) return;
    try {
      await sesionService.confirmarAsistencia(detalle.id);
      const updated = await sesionService.obtenerDetalle(detalle.id);
      setDetalle(updated);
      showToast('Asistencia confirmada', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      if (msg.includes('409') || msg.includes('ya registraste')) {
        showToast('Ya registraste esta respuesta', 'info');
      } else {
        showToast(msg, 'error');
      }
    }
  };

  const handleDeclinar = async () => {
    if (!detalle) return;
    try {
      await sesionService.declinarAsistencia(detalle.id);
      const updated = await sesionService.obtenerDetalle(detalle.id);
      setDetalle(updated);
      showToast('Asistencia declinada', 'success');
    } catch {
      showToast('Error al declinar asistencia', 'error');
    }
  };

  const cerrarModal = () => { setModal(null); setError(''); };

  const badges = (s: CalendarioSesionDTO) => (
    <div className="ses-event-meta">
      {s.cancelada && <span className="ses-event-badge ses-badge-cancelada">Cancelada</span>}
      {s.recurrencia && <span className="ses-event-badge ses-badge-recurrencia">{RECURRENCIA_ICON[s.recurrencia]} {RECURRENCIA_LABEL[s.recurrencia]}</span>}
      {s.grupoNombre && <span className="ses-event-badge ses-badge-grupo">👥 {s.grupoNombre}</span>}
      {s.miAsistencia && (
        <span className={`ses-event-badge ${s.miAsistencia === 'CONFIRMADA' ? 'ses-badge-confirmada' : s.miAsistencia === 'DECLINADA' ? 'ses-badge-declinada' : 'ses-badge-pendiente'}`}>
          {ASISTENCIA_LABEL[s.miAsistencia]}
        </span>
      )}
      {!s.cancelada && <span>{s.asistentes.filter((a) => a.estado === 'CONFIRMADA').length} confirmado(s)</span>}
    </div>
  );

  const renderSession = (s: CalendarioSesionDTO) => (
    <div key={s.id} className={`ses-event${s.cancelada ? ' cancelada' : ''}${selectedIds.has(s.id) ? ' selected' : ''}`} style={{ paddingLeft: multiMode ? 36 : 12 }}>
      {multiMode && !s.cancelada && (
        <input type="checkbox" className="ses-checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} />
      )}
      <div className="ses-event-time">{formatTime(s.fecha)}</div>
      <div className="ses-event-body" onClick={() => !multiMode && abrirDetalle(s)}>
        <div className="ses-event-title">{s.titulo}</div>
        <div style={{ fontSize: 12, color: '#667788' }}>📍 {s.lugar}</div>
        {badges(s)}
      </div>
      {!multiMode && !s.cancelada && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          <button className="ses-btn-sm ses-btn-danger" onClick={(e) => { e.stopPropagation(); abrirCancelarUna(s); }}>Cancelar</button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="ses-c">
        <div className="ses-hdr">
          <span className="ses-hdr-title">📚 Sesiones de Estudio</span>
          <div className="ses-hdr-actions">
            <button className={`ses-btn-sm ${multiMode ? 'ses-btn-danger' : 'ses-btn-outline'}`} onClick={() => { setMultiMode(!multiMode); setSelectedIds(new Set()); }}>
              {multiMode ? 'Salir selección' : 'Seleccionar múltiples'}
            </button>
            {multiMode && selectedIds.size > 0 && (
              <button className="ses-btn-sm ses-btn-danger" onClick={abrirCancelarMulti}>
                Cancelar ({selectedIds.size})
              </button>
            )}
            <button className="ses-btn" onClick={abrirCrear}>+ Nueva serie</button>
          </div>
        </div>

        <div className="ses-tabs">
          <button className={`ses-tab${viewMode === 'calendario' ? ' active' : ''}`} onClick={() => setViewMode('calendario')}>📅 Calendario</button>
          <button className={`ses-tab${viewMode === 'lista' ? ' active' : ''}`} onClick={() => setViewMode('lista')}>📋 Lista</button>
        </div>

        <div className="ses-filters">
          <select className="ses-filter-select" value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)}>
            <option value="todas">Todos los grupos</option>
            <option value="sin-grupo">Sin grupo</option>
            {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
          <select className="ses-filter-select" value={filtroRecurrencia} onChange={(e) => setFiltroRecurrencia(e.target.value)}>
            <option value="todas">Toda recurrencia</option>
            <option value="DIARIA">Diaria</option>
            <option value="SEMANAL">Semanal</option>
            <option value="QUINCENAL">Quincenal</option>
            <option value="no">No recurrente</option>
          </select>
        </div>

        {cargando && <p style={{ textAlign: 'center', color: '#888' }}>Cargando...</p>}

        {!cargando && !calendario.length && (
          <p className="ses-empty">No tienes sesiones programadas. ¡Crea una serie!</p>
        )}

        {!cargando && !sesionesFiltradas.length && calendario.length > 0 && (
          <p className="ses-empty">Ninguna sesión coincide con los filtros.</p>
        )}

        {!cargando && viewMode === 'calendario' && weeks.map((week) => (
          <div key={week.label} className="ses-cal-week">
            <div className="ses-cal-week-label">{week.label}</div>
            <div>
              {week.days.map((day) => (
                <div key={day.date.toISOString()} className="ses-cal-day">
                  <div className="ses-cal-day-header">
                    {formatDate(day.date)} <span>({day.sessions.length})</span>
                  </div>
                  <div className="ses-cal-sessions">
                    {day.sessions.map(renderSession)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!cargando && viewMode === 'lista' && (
          <div className="ses-cal">
            {sesionesFiltradas.map((s) => (
              <div key={s.id} className="ses-cal-week" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                  <div style={{ flex: 1 }}>
                    {renderSession(s)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Modal Crear Serie ── */}
        {modal === 'crear' && (
          <div className="ses-modal-overlay" onClick={cerrarModal}>
            <div className="ses-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ses-modal-title">Nueva serie de sesiones</div>

              <label className="ses-label">Título *</label>
              <input className="ses-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Álgebra lineal" />

              <label className="ses-label">Descripción *</label>
              <input className="ses-input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Temas a tratar..." />

              <label className="ses-label">Lugar *</label>
              <input className="ses-input" value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Ej: Biblioteca bloque E" />

              <label className="ses-label">Frecuencia *</label>
              <select className="ses-select" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as FrecuenciaRecurrencia)}>
                <option value="DIARIA">🔁 Diaria</option>
                <option value="SEMANAL">📆 Semanal</option>
                <option value="QUINCENAL">📅 Quincenal</option>
              </select>

              <label className="ses-label">Fecha inicio *</label>
              <input className="ses-input" type="datetime-local" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />

              <label className="ses-label">Fecha fin de la serie *</label>
              <input className="ses-input" type="datetime-local" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />

              <label className="ses-label">Recordatorio (minutos antes)</label>
              <input className="ses-input" type="number" min={5} value={recordatorio} onChange={(e) => setRecordatorio(Number(e.target.value))} />

              <label className="ses-label">Grupo (opcional)</label>
              <select className="ses-select" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
                <option value="">Sin grupo</option>
                {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
              {grupoId && (
                <p className="ses-grupo-info">📢 Se notificará a los miembros del grupo</p>
              )}

              {error && <p className="ses-error">{error}</p>}
              <div className="ses-modal-btns">
                <button className="ses-btn-outline" onClick={cerrarModal}>Cancelar</button>
                <button className="ses-btn" onClick={handleCrear} disabled={enviando}>
                  {enviando ? 'Creando...' : 'Crear serie'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Detalle ── */}
        {modal === 'detalle' && detalle && (
          <div className="ses-modal-overlay" onClick={cerrarModal}>
            <div className="ses-modal ses-modal-wide" onClick={(e) => e.stopPropagation()}>
              <div className="ses-modal-title">{detalle.titulo}</div>
              {detalle.cancelada && <p style={{ color: '#c0392b', fontWeight: 600, marginBottom: 8 }}>🚫 Esta sesión fue cancelada</p>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div><label className="ses-label">Fecha</label><p>{formatDateTime(detalle.fecha)}</p></div>
                <div><label className="ses-label">Lugar</label><p>📍 {detalle.lugar}</p></div>
                {detalle.recurrencia && <div><label className="ses-label">Recurrencia</label><p>{RECURRENCIA_ICON[detalle.recurrencia]} {RECURRENCIA_LABEL[detalle.recurrencia]}</p></div>}
                {detalle.grupoNombre && <div><label className="ses-label">Grupo</label><p>👥 {detalle.grupoNombre}</p></div>}
                <div><label className="ses-label">Recordatorio</label><p>⏰ {detalle.recordatorioMinutos} min antes</p></div>
              </div>

              {detalle.descripcion && (
                <>
                  <label className="ses-label">Descripción</label>
                  <p style={{ fontSize: 14, color: '#445566', marginBottom: 12 }}>{detalle.descripcion}</p>
                </>
              )}

              {userId && detalle.creadorId === userId && (
                <p style={{ fontSize: 12, color: '#8899aa', marginBottom: 8 }}>🛡️ Eres el organizador</p>
              )}

              <label className="ses-label">Participantes ({detalle.asistentes.length})</label>
              <ul className="ses-asistentes">
                {detalle.asistentes.map((a) => (
                  <li key={a.id} className="ses-asistente">
                    <span className="ses-asistente-nombre">{a.nombre} {a.apellido}</span>
                    <span className={`ses-asistente-estado ${a.estado === 'CONFIRMADA' ? 'ses-badge-confirmada' : a.estado === 'DECLINADA' ? 'ses-badge-declinada' : 'ses-badge-pendiente'}`}>
                      {ASISTENCIA_LABEL[a.estado]}
                    </span>
                  </li>
                ))}
              </ul>

              {!detalle.cancelada && userId && detalle.asistentes.some((a) => a.usuarioId === userId) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  {detalle.miAsistencia !== 'CONFIRMADA' && (
                    <button className="ses-btn ses-btn-confirm" onClick={handleAsistir} disabled={enviando}>
                      ✅ Asistiré
                    </button>
                  )}
                  {detalle.miAsistencia !== 'DECLINADA' && (
                    <button className="ses-btn ses-btn-decline" onClick={handleDeclinar} disabled={enviando}>
                      ❌ No podré asistir
                    </button>
                  )}
                  {detalle.miAsistencia && (
                    <span style={{ fontSize: 12, color: '#8899aa', alignSelf: 'center' }}>
                      Actual: {ASISTENCIA_LABEL[detalle.miAsistencia]}
                    </span>
                  )}
                </div>
              )}

              <div className="ses-modal-btns" style={{ marginTop: 16 }}>
                <button className="ses-btn-outline" onClick={cerrarModal}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Cancelar Una ── */}
        {modal === 'cancelar-una' && sesionActual && (
          <div className="ses-modal-overlay" onClick={cerrarModal}>
            <div className="ses-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ses-modal-title">Cancelar sesión</div>
              <p style={{ color: '#445566', marginBottom: 16 }}>
                ¿Qué deseas cancelar de "<strong>{sesionActual.titulo}</strong>"?
              </p>
              <div className="ses-alcance-group">
                <div className={`ses-alcance-opt${alcance === 'solo_esta' ? ' active' : ''}`} onClick={() => setAlcance('solo_esta')}>Solo esta sesión</div>
                <div className={`ses-alcance-opt${alcance === 'esta_y_siguientes' ? ' active' : ''}`} onClick={() => setAlcance('esta_y_siguientes')}>Esta y siguientes</div>
              </div>
              {error && <p className="ses-error">{error}</p>}
              <div className="ses-modal-btns">
                <button className="ses-btn-outline" onClick={cerrarModal}>No cancelar</button>
                <button className="ses-btn ses-btn-danger" onClick={handleCancelarUna} disabled={enviando}>
                  {enviando ? 'Cancelando...' : 'Confirmar cancelación'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Cancelar Múltiples ── */}
        {modal === 'cancelar-multi' && (
          <div className="ses-modal-overlay" onClick={cerrarModal}>
            <div className="ses-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ses-modal-title">Cancelar sesiones seleccionadas</div>
              <p style={{ color: '#445566', marginBottom: 16 }}>
                ¿Cancelar <strong>{selectedIds.size}</strong> sesión(es)? Esta acción no se puede deshacer.
              </p>
              {error && <p className="ses-error">{error}</p>}
              <div className="ses-modal-btns">
                <button className="ses-btn-outline" onClick={cerrarModal}>Volver</button>
                <button className="ses-btn ses-btn-danger" onClick={handleCancelarMulti} disabled={enviando}>
                  {enviando ? 'Cancelando...' : `Sí, cancelar ${selectedIds.size}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`ses-toast ses-toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    </>
  );
}
