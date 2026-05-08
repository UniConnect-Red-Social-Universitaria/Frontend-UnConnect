import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { foroService, ForoPregunta, ForoRespuesta } from '../services/foro.service';

const CSS = `
  .foro-container { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
  .foro-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .foro-back { background: none; border: none; cursor: pointer; font-size: 20px; color: #003e70; }
  .foro-title { font-size: 22px; font-weight: 700; color: #003e70; flex: 1; }
  .foro-btn { background: #003e70; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-weight: 600; font-size: 14px; }
  .foro-btn:hover { background: #00529a; }
  .foro-card { background: #fff; border: 1px solid #e8eef4; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; cursor: pointer; transition: box-shadow 0.18s; }
  .foro-card:hover { box-shadow: 0 4px 16px rgba(0,62,112,0.1); }
  .foro-card-title { font-size: 16px; font-weight: 700; color: #1a2a3a; margin-bottom: 4px; }
  .foro-card-meta { font-size: 12px; color: #8899aa; margin-bottom: 8px; }
  .foro-card-preview { font-size: 14px; color: #445566; white-space: pre-wrap; }
  .foro-card-content { font-size: 14px; color: #333; margin-bottom: 8px; white-space: pre-wrap; }
  .foro-vote { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
  .foro-vote-btn { background: none; border: 1px solid #dde4ec; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 16px; transition: all 0.15s; }
  .foro-vote-btn:hover { border-color: #003e70; }
  .foro-score { font-size: 16px; font-weight: 700; min-width: 28px; text-align: center; color: #003e70; }
  .foro-empty { text-align: center; color: #aaa; padding: 48px 0; font-size: 15px; }
  .foro-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .foro-modal { background: #fff; border-radius: 16px; padding: 28px; max-width: 520px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  .foro-modal-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #003e70; }
  .foro-input { width: 100%; padding: 10px 12px; border: 1px solid #dde4ec; border-radius: 8px; font-size: 14px; box-sizing: border-box; margin-bottom: 12px; font-family: inherit; }
  .foro-input:focus { outline: none; border-color: #003e70; }
  .foro-textarea { resize: vertical; min-height: 100px; }
  .foro-modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
  .foro-btn-secondary { background: none; border: 1px solid #dde4ec; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; }
`;

type Vista = 'preguntas' | 'respuestas';

export default function ForoScreen() {
  const { materiaId } = useParams<{ materiaId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const materiaNombre = searchParams.get('nombre') ?? 'Asignatura';

  const [vista, setVista] = useState<Vista>('preguntas');
  const [preguntas, setPreguntas] = useState<ForoPregunta[]>([]);
  const [respuestas, setRespuestas] = useState<ForoRespuesta[]>([]);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<ForoPregunta | null>(null);
  const [cargando, setCargando] = useState(false);

  const [modalPregunta, setModalPregunta] = useState(false);
  const [modalRespuesta, setModalRespuesta] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargarPreguntas = useCallback(async () => {
    if (!materiaId) return;
    setCargando(true);
    try {
      const data = await foroService.obtenerPreguntas(materiaId);
      setPreguntas(data);
    } finally {
      setCargando(false);
    }
  }, [materiaId]);

  const cargarRespuestas = useCallback(async (preguntaId: string) => {
    setCargando(true);
    try {
      const data = await foroService.obtenerRespuestas(preguntaId);
      setRespuestas(data);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarPreguntas(); }, [cargarPreguntas]);

  const abrirPregunta = (p: ForoPregunta) => {
    setPreguntaSeleccionada(p);
    setVista('respuestas');
    cargarRespuestas(p.id);
  };

  const handlePublicarPregunta = async () => {
    if (!titulo.trim() || !contenido.trim() || !materiaId) return;
    setEnviando(true);
    setError('');
    try {
      const nueva = await foroService.publicarPregunta(materiaId, titulo, contenido);
      setPreguntas(prev => [nueva, ...prev]);
      setTitulo(''); setContenido('');
      setModalPregunta(false);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'No tienes matrícula activa en esta asignatura');
    } finally {
      setEnviando(false);
    }
  };

  const handlePublicarRespuesta = async () => {
    if (!contenido.trim() || !preguntaSeleccionada || !materiaId) return;
    setEnviando(true);
    setError('');
    try {
      const nueva = await foroService.publicarRespuesta(preguntaSeleccionada.id, materiaId, contenido);
      setRespuestas(prev => [...prev, nueva].sort((a, b) => b.puntuacion - a.puntuacion));
      setContenido('');
      setModalRespuesta(false);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'No tienes matrícula activa en esta asignatura');
    } finally {
      setEnviando(false);
    }
  };

  const handleVotar = async (respuestaId: string, valor: 1 | -1) => {
    try {
      const actualizada = await foroService.votarRespuesta(respuestaId, valor);
      setRespuestas(prev =>
        prev
          .map(r => (r.id === respuestaId ? actualizada : r))
          .sort((a, b) => b.puntuacion - a.puntuacion),
      );
    } catch { /* ignore */ }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="foro-container">
        {/* Header */}
        <div className="foro-header">
          <button
            className="foro-back"
            onClick={() => vista === 'respuestas' ? setVista('preguntas') : navigate(-1)}
          >
            ←
          </button>
          <span className="foro-title">
            {vista === 'preguntas' ? `Foro · ${materiaNombre}` : preguntaSeleccionada?.titulo}
          </span>
          <button
            className="foro-btn"
            onClick={() => vista === 'preguntas' ? setModalPregunta(true) : setModalRespuesta(true)}
          >
            {vista === 'preguntas' ? '+ Pregunta' : '+ Respuesta'}
          </button>
        </div>

        {cargando && <p style={{ textAlign: 'center', color: '#888' }}>Cargando...</p>}

        {/* Lista preguntas */}
        {!cargando && vista === 'preguntas' && (
          preguntas.length === 0
            ? <p className="foro-empty">No hay preguntas aún. ¡Sé el primero!</p>
            : preguntas.map(p => (
              <div key={p.id} className="foro-card" onClick={() => abrirPregunta(p)}>
                <div className="foro-card-title">{p.titulo}</div>
                <div className="foro-card-meta">{p.autorNombre} · {new Date(p.createdAt).toLocaleDateString()}</div>
                <div className="foro-card-preview">{p.contenido.slice(0, 120)}{p.contenido.length > 120 ? '...' : ''}</div>
              </div>
            ))
        )}

        {/* Lista respuestas */}
        {!cargando && vista === 'respuestas' && (
          respuestas.length === 0
            ? <p className="foro-empty">No hay respuestas aún.</p>
            : respuestas.map(r => (
              <div key={r.id} className="foro-card" style={{ cursor: 'default' }}>
                <div className="foro-card-content">{r.contenido}</div>
                <div className="foro-card-meta">{r.autorNombre} · {new Date(r.createdAt).toLocaleDateString()}</div>
                <div className="foro-vote">
                  <button className="foro-vote-btn" onClick={() => handleVotar(r.id, 1)}>▲</button>
                  <span className="foro-score">{r.puntuacion}</span>
                  <button className="foro-vote-btn" onClick={() => handleVotar(r.id, -1)}>▼</button>
                </div>
              </div>
            ))
        )}

        {/* Modal nueva pregunta */}
        {modalPregunta && (
          <div className="foro-modal-overlay" onClick={() => setModalPregunta(false)}>
            <div className="foro-modal" onClick={e => e.stopPropagation()}>
              <div className="foro-modal-title">Nueva pregunta</div>
              <input className="foro-input" placeholder="Título" value={titulo} onChange={e => setTitulo(e.target.value)} />
              <textarea className="foro-input foro-textarea" placeholder="Describe tu duda..." value={contenido} onChange={e => setContenido(e.target.value)} />
              {error && <p style={{ color: '#e74c3c', fontSize: 13 }}>{error}</p>}
              <div className="foro-modal-btns">
                <button className="foro-btn-secondary" onClick={() => { setModalPregunta(false); setError(''); }}>Cancelar</button>
                <button className="foro-btn" onClick={handlePublicarPregunta} disabled={enviando}>
                  {enviando ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal nueva respuesta */}
        {modalRespuesta && (
          <div className="foro-modal-overlay" onClick={() => setModalRespuesta(false)}>
            <div className="foro-modal" onClick={e => e.stopPropagation()}>
              <div className="foro-modal-title">Responder</div>
              <textarea className="foro-input foro-textarea" placeholder="Escribe tu respuesta..." value={contenido} onChange={e => setContenido(e.target.value)} />
              {error && <p style={{ color: '#e74c3c', fontSize: 13 }}>{error}</p>}
              <div className="foro-modal-btns">
                <button className="foro-btn-secondary" onClick={() => { setModalRespuesta(false); setError(''); }}>Cancelar</button>
                <button className="foro-btn" onClick={handlePublicarRespuesta} disabled={enviando}>
                  {enviando ? 'Publicando...' : 'Responder'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
