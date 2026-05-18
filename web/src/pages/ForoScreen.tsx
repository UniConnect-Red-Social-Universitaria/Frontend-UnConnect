import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { foroService } from '../services/foro.service';
import type { ForoPregunta, ForoRespuesta } from '../services/foro.service';

type ForoRespuestaUI = ForoRespuesta & {
	miVoto?: 1 | -1 | null;
};

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
	.foro-vote { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #eef2f6; }
	.foro-vote-label { font-size: 12px; font-weight: 700; color: #6b7f92; letter-spacing: 0.2px; text-transform: uppercase; }
	.foro-vote-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
	.foro-vote-btn { display: inline-flex; align-items: center; gap: 6px; background: #f8fbfe; border: 1px solid #dde4ec; border-radius: 999px; padding: 8px 12px; cursor: pointer; font-size: 14px; font-weight: 700; color: #1a2a3a; transition: all 0.15s; }
	.foro-vote-btn:hover:not(:disabled) { transform: translateY(-1px); border-color: #003e70; }
	.foro-vote-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
	.foro-vote-btn.up { color: #1e8449; }
	.foro-vote-btn.down { color: #c0392b; }
	.foro-vote-btn.up.active { background: #e7f7ee; border-color: #1e8449; }
	.foro-vote-btn.down.active { background: #fce8e8; border-color: #c0392b; }
	.foro-score { display: inline-flex; align-items: center; justify-content: center; min-width: 70px; padding: 7px 12px; border-radius: 999px; background: #eaf2f8; color: #003e70; font-size: 14px; font-weight: 800; }
	.foro-score.negative { background: #fce8e8; color: #c0392b; }
	.foro-score.neutral { background: #eef4f8; color: #4a6a85; }
	.foro-score.positive { background: #e7f7ee; color: #1e8449; }
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
	const [respuestas, setRespuestas] = useState<ForoRespuestaUI[]>([]);
	const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<ForoPregunta | null>(
		null
	);
	const [cargando, setCargando] = useState(false);

	const [modalPregunta, setModalPregunta] = useState(false);
	const [modalRespuesta, setModalRespuesta] = useState(false);
	const [titulo, setTitulo] = useState('');
	const [contenido, setContenido] = useState('');
	const [enviando, setEnviando] = useState(false);
	const [votoEnCurso, setVotoEnCurso] = useState<string | null>(null);
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
			setRespuestas(data as ForoRespuestaUI[]);
		} finally {
			setCargando(false);
		}
	}, []);

	useEffect(() => {
		cargarPreguntas();
	}, [cargarPreguntas]);

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
			setPreguntas((prev) => [nueva, ...prev]);
			setTitulo('');
			setContenido('');
			setModalPregunta(false);
		} catch (e: any) {
			setError(
				e?.message ??
					e?.response?.data?.error ??
					'No tienes matrícula activa en esta asignatura'
			);
		} finally {
			setEnviando(false);
		}
	};

	const handlePublicarRespuesta = async () => {
		if (!contenido.trim() || !preguntaSeleccionada || !materiaId) return;
		setEnviando(true);
		setError('');
		try {
			await foroService.publicarRespuesta(preguntaSeleccionada.id, materiaId, contenido);
			setContenido('');
			setModalRespuesta(false);
			await cargarRespuestas(preguntaSeleccionada.id);
		} catch (e: any) {
			setError(
				e?.message ??
					e?.response?.data?.error ??
					'No tienes matrícula activa en esta asignatura'
			);
		} finally {
			setEnviando(false);
		}
	};

	const handleVotar = async (respuestaId: string, valor: 1 | -1) => {
		const respuestaActual = respuestas.find((respuesta) => respuesta.id === respuestaId);
		if (respuestaActual?.miVoto === valor) return;
		if (votoEnCurso === respuestaId) return;
		setVotoEnCurso(respuestaId);
		try {
			const actualizada = await foroService.votarRespuesta(respuestaId, valor);
			setRespuestas((prev) =>
				prev.map((respuesta) =>
					respuesta.id === respuestaId
						? { ...respuesta, puntuacion: actualizada.puntuacion, miVoto: valor }
						: respuesta
				)
			);
		} catch {
			/* ignore */
		} finally {
			setVotoEnCurso((current) => (current === respuestaId ? null : current));
		}
	};

	return (
		<>
			<style>{CSS}</style>
			<div className="foro-container">
				{/* Header */}
				<div className="foro-header">
					<button
						className="foro-back"
						onClick={() =>
							vista === 'respuestas' ? setVista('preguntas') : navigate(-1)
						}
					>
						←
					</button>
					<span className="foro-title">
						{vista === 'preguntas'
							? `Foro · ${materiaNombre}`
							: preguntaSeleccionada?.titulo}
					</span>
					<button
						className="foro-btn"
						onClick={() =>
							vista === 'preguntas' ? setModalPregunta(true) : setModalRespuesta(true)
						}
					>
						{vista === 'preguntas' ? '+ Pregunta' : '+ Respuesta'}
					</button>
				</div>

				{cargando && <p style={{ textAlign: 'center', color: '#888' }}>Cargando...</p>}

				{/* Lista preguntas */}
				{!cargando &&
					vista === 'preguntas' &&
					(preguntas.length === 0 ? (
						<p className="foro-empty">No hay preguntas aún. ¡Sé el primero!</p>
					) : (
						preguntas.map((p) => (
							<div key={p.id} className="foro-card" onClick={() => abrirPregunta(p)}>
								<div className="foro-card-title">{p.titulo}</div>
								<div className="foro-card-meta">
									{p.autorNombre} · {new Date(p.createdAt).toLocaleDateString()}
								</div>
								<div className="foro-card-preview">
									{p.contenido.slice(0, 120)}
									{p.contenido.length > 120 ? '...' : ''}
								</div>
							</div>
						))
					))}

				{/* Lista respuestas */}
				{!cargando &&
					vista === 'respuestas' &&
					(respuestas.length === 0 ? (
						<p className="foro-empty">No hay respuestas aún.</p>
					) : (
						respuestas.map((r) => (
							<div key={r.id} className="foro-card" style={{ cursor: 'default' }}>
								<div className="foro-card-content">{r.contenido}</div>
								<div className="foro-card-meta">
									{r.autorNombre} · {new Date(r.createdAt).toLocaleDateString()}
								</div>
								<div className="foro-vote">
									<span className="foro-vote-label">Voto rápido</span>
									<div className="foro-vote-actions">
										<button
											type="button"
											className={`foro-vote-btn up${r.miVoto === 1 ? ' active' : ''}`}
											onClick={() => handleVotar(r.id, 1)}
											disabled={votoEnCurso === r.id || r.miVoto === 1}
											aria-label="Votar a favor"
										>
											▲
										</button>
										<span
											className={`foro-score${r.puntuacion < 0 ? ' negative' : r.puntuacion > 0 ? ' positive' : ' neutral'}`}
										>
											{r.puntuacion > 0 ? `+${r.puntuacion}` : String(r.puntuacion)}{' '}
											puntos
										</span>
										<button
											type="button"
											className={`foro-vote-btn down${r.miVoto === -1 ? ' active' : ''}`}
											onClick={() => handleVotar(r.id, -1)}
											disabled={votoEnCurso === r.id || r.miVoto === -1}
											aria-label="Votar en contra"
										>
											▼
										</button>
									</div>
								</div>
							</div>
						))
					))}

				{/* Modal nueva pregunta */}
				{modalPregunta && (
					<div className="foro-modal-overlay" onClick={() => setModalPregunta(false)}>
						<div className="foro-modal" onClick={(e) => e.stopPropagation()}>
							<div className="foro-modal-title">Nueva pregunta</div>
							<input
								className="foro-input"
								placeholder="Título"
								value={titulo}
								onChange={(e) => setTitulo(e.target.value)}
							/>
							<textarea
								className="foro-input foro-textarea"
								placeholder="Describe tu duda..."
								value={contenido}
								onChange={(e) => setContenido(e.target.value)}
							/>
							{error && <p style={{ color: '#e74c3c', fontSize: 13 }}>{error}</p>}
							<div className="foro-modal-btns">
								<button
									className="foro-btn-secondary"
									onClick={() => {
										setModalPregunta(false);
										setError('');
									}}
								>
									Cancelar
								</button>
								<button
									className="foro-btn"
									onClick={handlePublicarPregunta}
									disabled={enviando}
								>
									{enviando ? 'Publicando...' : 'Publicar'}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Modal nueva respuesta */}
				{modalRespuesta && (
					<div className="foro-modal-overlay" onClick={() => setModalRespuesta(false)}>
						<div className="foro-modal" onClick={(e) => e.stopPropagation()}>
							<div className="foro-modal-title">Responder</div>
							<textarea
								className="foro-input foro-textarea"
								placeholder="Escribe tu respuesta..."
								value={contenido}
								onChange={(e) => setContenido(e.target.value)}
							/>
							{error && <p style={{ color: '#e74c3c', fontSize: 13 }}>{error}</p>}
							<div className="foro-modal-btns">
								<button
									className="foro-btn-secondary"
									onClick={() => {
										setModalRespuesta(false);
										setError('');
									}}
								>
									Cancelar
								</button>
								<button
									className="foro-btn"
									onClick={handlePublicarRespuesta}
									disabled={enviando}
								>
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
