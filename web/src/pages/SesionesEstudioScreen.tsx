import { useState, useEffect, useCallback } from 'react';
import { sesionService, SesionDTO, FrecuenciaRecurrencia, AlcanceModificacion } from '../services/sesion.service';

const CSS = `
  .ses-container { max-width: 860px; margin: 0 auto; padding: 24px 16px; }
  .ses-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .ses-title { font-size: 22px; font-weight: 700; color: #003e70; }
  .ses-btn { background: #003e70; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-weight: 600; font-size: 14px; }
  .ses-btn:hover { background: #00529a; }
  .ses-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .ses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .ses-card { background: #fff; border: 1px solid #e8eef4; border-radius: 12px; padding: 16px 18px; }
  .ses-card-title { font-size: 15px; font-weight: 700; color: #1a2a3a; margin-bottom: 4px; }
  .ses-card-meta { font-size: 12px; color: #8899aa; margin-bottom: 6px; }
  .ses-card-lugar { font-size: 13px; color: #445566; margin-bottom: 10px; }
  .ses-card-modificada { font-size: 11px; color: #f39c12; font-weight: 600; margin-bottom: 6px; }
  .ses-card-actions { display: flex; gap: 8px; }
  .ses-btn-sm { font-size: 12px; padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; }
  .ses-btn-edit { background: #e8f0fe; color: #003e70; }
  .ses-btn-edit:hover { background: #c7d8fc; }
  .ses-btn-cancel { background: #fde8e8; color: #c0392b; }
  .ses-btn-cancel:hover { background: #f5c6c6; }
  .ses-empty { text-align: center; color: #aaa; padding: 60px 0; font-size: 15px; }
  .ses-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .ses-modal { background: #fff; border-radius: 16px; padding: 28px; max-width: 520px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
  .ses-modal-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #003e70; }
  .ses-label { font-size: 13px; font-weight: 600; color: #445566; margin-bottom: 4px; display: block; }
  .ses-input { width: 100%; padding: 10px 12px; border: 1px solid #dde4ec; border-radius: 8px; font-size: 14px; box-sizing: border-box; margin-bottom: 12px; font-family: inherit; }
  .ses-input:focus { outline: none; border-color: #003e70; }
  .ses-select { width: 100%; padding: 10px 12px; border: 1px solid #dde4ec; border-radius: 8px; font-size: 14px; box-sizing: border-box; margin-bottom: 12px; background: #fff; }
  .ses-modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  .ses-btn-secondary { background: none; border: 1px solid #dde4ec; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; }
  .ses-error { color: #e74c3c; font-size: 13px; margin-bottom: 8px; }
  .ses-alcance-group { display: flex; gap: 12px; margin-bottom: 12px; }
  .ses-alcance-opt { flex: 1; border: 2px solid #dde4ec; border-radius: 8px; padding: 10px; cursor: pointer; text-align: center; font-size: 13px; transition: all 0.15s; }
  .ses-alcance-opt.active { border-color: #003e70; background: #e8f0fe; color: #003e70; font-weight: 600; }
`;

type ModalTipo = 'crear' | 'editar' | 'cancelar' | null;

export default function SesionesEstudioScreen() {
  const [sesiones, setSesiones] = useState<SesionDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState<ModalTipo>(null);
  const [sesionActual, setSesionActual] = useState<SesionDTO | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [alcance, setAlcance] = useState<AlcanceModificacion>('solo_esta');

  // Campos formulario crear
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [frecuencia, setFrecuencia] = useState<FrecuenciaRecurrencia>('SEMANAL');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [recordatorio, setRecordatorio] = useState(30);

  // Campos formulario editar
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editLugar, setEditLugar] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editRecordatorio, setEditRecordatorio] = useState(30);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await sesionService.obtenerSesiones();
      setSesiones(data);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const abrirEditar = (s: SesionDTO) => {
    setSesionActual(s);
    setEditTitulo(s.titulo);
    setEditDescripcion(s.descripcion);
    setEditLugar(s.lugar);
    setEditFecha(new Date(s.fecha).toISOString().slice(0, 16));
    setEditRecordatorio(s.recordatorioMinutos);
    setAlcance('solo_esta');
    setError('');
    setModal('editar');
  };

  const abrirCancelar = (s: SesionDTO) => {
    setSesionActual(s);
    setAlcance('solo_esta');
    setError('');
    setModal('cancelar');
  };

  const handleCrear = async () => {
    if (!titulo.trim() || !descripcion.trim() || !lugar.trim() || !fechaInicio || !fechaFin) {
      setError('Completa todos los campos');
      return;
    }
    setEnviando(true); setError('');
    try {
      await sesionService.crearSerie({ titulo, descripcion, lugar, frecuencia, fechaInicio, fechaFin, recordatorioMinutos: recordatorio });
      setModal(null);
      setTitulo(''); setDescripcion(''); setLugar(''); setFechaInicio(''); setFechaFin('');
      await cargar();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Error al crear la serie');
    } finally {
      setEnviando(false);
    }
  };

  const handleEditar = async () => {
    if (!sesionActual) return;
    setEnviando(true); setError('');
    try {
      await sesionService.modificarSesion(sesionActual.id, alcance, {
        titulo: editTitulo, descripcion: editDescripcion, lugar: editLugar,
        fecha: editFecha ? new Date(editFecha).toISOString() : undefined,
        recordatorioMinutos: editRecordatorio,
      });
      setModal(null);
      await cargar();
    } catch {
      setError('Error al modificar la sesión');
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelar = async () => {
    if (!sesionActual) return;
    setEnviando(true); setError('');
    try {
      await sesionService.cancelarSesion(sesionActual.id, alcance);
      setModal(null);
      await cargar();
    } catch {
      setError('Error al cancelar la sesión');
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => { setModal(null); setError(''); };

  return (
    <>
      <style>{CSS}</style>
      <div className="ses-container">
        <div className="ses-header">
          <span className="ses-title">Sesiones de Estudio</span>
          <button className="ses-btn" onClick={() => { setError(''); setModal('crear'); }}>+ Nueva serie</button>
        </div>

        {cargando && <p style={{ textAlign: 'center', color: '#888' }}>Cargando...</p>}

        {!cargando && sesiones.length === 0 && (
          <p className="ses-empty">No tienes sesiones programadas. ¡Crea una serie!</p>
        )}

        {!cargando && sesiones.length > 0 && (
          <div className="ses-grid">
            {sesiones.map(s => (
              <div key={s.id} className="ses-card">
                <div className="ses-card-title">{s.titulo}</div>
                {s.modificada && <div className="ses-card-modificada">✎ Modificada</div>}
                <div className="ses-card-meta">
                  {new Date(s.fecha).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="ses-card-lugar">📍 {s.lugar}</div>
                <div className="ses-card-meta">⏰ Recordatorio: {s.recordatorioMinutos} min antes</div>
                <div className="ses-card-actions">
                  <button className="ses-btn-sm ses-btn-edit" onClick={() => abrirEditar(s)}>Editar</button>
                  <button className="ses-btn-sm ses-btn-cancel" onClick={() => abrirCancelar(s)}>Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal crear serie */}
        {modal === 'crear' && (
          <div className="ses-modal-overlay" onClick={cerrar}>
            <div className="ses-modal" onClick={e => e.stopPropagation()}>
              <div className="ses-modal-title">Nueva serie de sesiones</div>
              <label className="ses-label">Título</label>
              <input className="ses-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Álgebra lineal" />
              <label className="ses-label">Descripción</label>
              <input className="ses-input" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Temas a tratar..." />
              <label className="ses-label">Lugar</label>
              <input className="ses-input" value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Ej: Biblioteca bloque E" />
              <label className="ses-label">Frecuencia</label>
              <select className="ses-select" value={frecuencia} onChange={e => setFrecuencia(e.target.value as FrecuenciaRecurrencia)}>
                <option value="DIARIA">Diaria</option>
                <option value="SEMANAL">Semanal</option>
                <option value="QUINCENAL">Quincenal</option>
              </select>
              <label className="ses-label">Fecha inicio</label>
              <input className="ses-input" type="datetime-local" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              <label className="ses-label">Fecha fin de la serie</label>
              <input className="ses-input" type="datetime-local" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
              <label className="ses-label">Recordatorio (minutos antes)</label>
              <input className="ses-input" type="number" min={5} value={recordatorio} onChange={e => setRecordatorio(Number(e.target.value))} />
              {error && <p className="ses-error">{error}</p>}
              <div className="ses-modal-btns">
                <button className="ses-btn-secondary" onClick={cerrar}>Cancelar</button>
                <button className="ses-btn" onClick={handleCrear} disabled={enviando}>{enviando ? 'Creando...' : 'Crear serie'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal editar sesión */}
        {modal === 'editar' && sesionActual && (
          <div className="ses-modal-overlay" onClick={cerrar}>
            <div className="ses-modal" onClick={e => e.stopPropagation()}>
              <div className="ses-modal-title">Editar sesión</div>
              <label className="ses-label">Aplicar cambio a</label>
              <div className="ses-alcance-group">
                <div className={`ses-alcance-opt${alcance === 'solo_esta' ? ' active' : ''}`} onClick={() => setAlcance('solo_esta')}>Solo esta sesión</div>
                <div className={`ses-alcance-opt${alcance === 'esta_y_siguientes' ? ' active' : ''}`} onClick={() => setAlcance('esta_y_siguientes')}>Esta y siguientes</div>
              </div>
              <label className="ses-label">Título</label>
              <input className="ses-input" value={editTitulo} onChange={e => setEditTitulo(e.target.value)} />
              <label className="ses-label">Descripción</label>
              <input className="ses-input" value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} />
              <label className="ses-label">Lugar</label>
              <input className="ses-input" value={editLugar} onChange={e => setEditLugar(e.target.value)} />
              <label className="ses-label">Fecha</label>
              <input className="ses-input" type="datetime-local" value={editFecha} onChange={e => setEditFecha(e.target.value)} />
              <label className="ses-label">Recordatorio (minutos antes)</label>
              <input className="ses-input" type="number" min={5} value={editRecordatorio} onChange={e => setEditRecordatorio(Number(e.target.value))} />
              {error && <p className="ses-error">{error}</p>}
              <div className="ses-modal-btns">
                <button className="ses-btn-secondary" onClick={cerrar}>Cancelar</button>
                <button className="ses-btn" onClick={handleEditar} disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal confirmar cancelación */}
        {modal === 'cancelar' && sesionActual && (
          <div className="ses-modal-overlay" onClick={cerrar}>
            <div className="ses-modal" onClick={e => e.stopPropagation()}>
              <div className="ses-modal-title">Cancelar sesión</div>
              <p style={{ color: '#445566', marginBottom: 16 }}>¿Qué deseas cancelar?</p>
              <div className="ses-alcance-group">
                <div className={`ses-alcance-opt${alcance === 'solo_esta' ? ' active' : ''}`} onClick={() => setAlcance('solo_esta')}>Solo esta sesión</div>
                <div className={`ses-alcance-opt${alcance === 'esta_y_siguientes' ? ' active' : ''}`} onClick={() => setAlcance('esta_y_siguientes')}>Esta y siguientes</div>
              </div>
              {error && <p className="ses-error">{error}</p>}
              <div className="ses-modal-btns">
                <button className="ses-btn-secondary" onClick={cerrar}>No cancelar</button>
                <button className="ses-btn" style={{ background: '#c0392b' }} onClick={handleCancelar} disabled={enviando}>{enviando ? 'Cancelando...' : 'Confirmar'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
