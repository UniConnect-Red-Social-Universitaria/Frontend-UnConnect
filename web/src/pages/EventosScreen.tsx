import { useState, useEffect, useCallback } from 'react';
import theme from '@uniconnect/theme';
import { apiClient } from '../api/apiClient';

type CategoriaEvento = 'academico' | 'cultural' | 'deportivo' | 'otro';

const CATEGORIAS: { value: CategoriaEvento | 'todas'; label: string; icon: string }[] = [
	{ value: 'todas',      label: 'Todas',      icon: '🗂️' },
	{ value: 'academico',  label: 'Académico',  icon: '🎓' },
	{ value: 'cultural',   label: 'Cultural',   icon: '🎭' },
	{ value: 'deportivo',  label: 'Deportivo',  icon: '⚽' },
	{ value: 'otro',       label: 'Otro',       icon: '📌' },
];

type Evento = {
	id: string;
	titulo: string;
	descripcion: string;
	lugar?: string | null;
	fechaEvento: string;
	categoria: CategoriaEvento;
	creador: { id: string; nombre: string; apellido: string; correo: string };
};

function formatearFecha(fechaIso: string): string {
	const fecha = new Date(fechaIso);
	if (isNaN(fecha.getTime())) return 'Fecha inválida';
	return new Intl.DateTimeFormat('es-CO', { dateStyle: 'full', timeStyle: 'short' }).format(fecha);
}

const BADGE_COLORS: Record<CategoriaEvento, { bg: string; color: string }> = {
	academico:  { bg: '#e8f0fe', color: '#1a73e8' },
	cultural:   { bg: '#fce8b2', color: '#b06000' },
	deportivo:  { bg: '#e6f4ea', color: '#1e8449' },
	otro:       { bg: '#f0f4f8', color: '#4a6a85' },
};

const SUSCRIPCIONES_KEY = 'uc_suscripciones_categorias';

export default function EventosScreen() {
	const [eventos, setEventos] = useState<Evento[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filtro, setFiltro] = useState<CategoriaEvento | 'todas'>('todas');
	const [categoriasSuscritas, setCategoriasSuscritas] = useState<Set<CategoriaEvento>>(new Set());
	const [showCrear, setShowCrear] = useState(false);
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

	// Crear evento form
	const [form, setForm] = useState({ titulo: '', descripcion: '', lugar: '', fechaEvento: '', horaEvento: '', categoria: 'academico' as CategoriaEvento });
	const [creandoEvento, setCreandoEvento] = useState(false);
	const [crearError, setCrearError] = useState('');

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	const cargarEventos = useCallback(async (cat?: CategoriaEvento | 'todas') => {
		setLoading(true);
		setError(null);
		try {
			const url = cat && cat !== 'todas' ? `/api/eventos?categoria=${cat}` : '/api/eventos';
			const resp = await apiClient.get<Evento[]>(url);
			setEventos(resp.data ?? []);
		} catch (err: any) {
			setError(err.message || 'Error al cargar eventos');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar suscripciones guardadas
		try {
			const raw = localStorage.getItem(SUSCRIPCIONES_KEY);
			if (raw) setCategoriasSuscritas(new Set(JSON.parse(raw)));
		} catch {}
		cargarEventos('todas');
	}, [cargarEventos]);

	const aplicarFiltro = async (cat: CategoriaEvento | 'todas') => {
		setFiltro(cat);
		await cargarEventos(cat);
	};

	const toggleSuscripcion = async (cat: CategoriaEvento) => {
		const suscrito = categoriasSuscritas.has(cat);
		try {
			if (suscrito) {
				await apiClient.delete(`/api/eventos/suscripciones/${cat}`);
			} else {
				await apiClient.post('/api/eventos/suscripciones', { categoria: cat });
			}
			const next = new Set(categoriasSuscritas);
			suscrito ? next.delete(cat) : next.add(cat);
			setCategoriasSuscritas(next);
			localStorage.setItem(SUSCRIPCIONES_KEY, JSON.stringify(Array.from(next)));
			showMsg(suscrito ? `Desuscrito de eventos ${cat}` : `Suscrito a eventos ${cat}`);
		} catch {
			showMsg('No se pudo actualizar la suscripción', 'error');
		}
	};

	const handleCrearEvento = async (e: React.FormEvent) => {
		e.preventDefault();
		setCrearError('');
		if (!form.titulo.trim()) { setCrearError('El título es obligatorio.'); return; }
		if (!form.descripcion.trim()) { setCrearError('La descripción es obligatoria.'); return; }
		if (!form.fechaEvento) { setCrearError('La fecha es obligatoria.'); return; }
		if (!form.horaEvento) { setCrearError('La hora es obligatoria.'); return; }

		const fechaCompleta = new Date(`${form.fechaEvento}T${form.horaEvento}:00`);
		if (isNaN(fechaCompleta.getTime())) { setCrearError('Fecha u hora inválida.'); return; }
		if (fechaCompleta < new Date()) { setCrearError('La fecha debe ser futura.'); return; }

		setCreandoEvento(true);
		try {
			await apiClient.post('/api/eventos', {
				titulo: form.titulo.trim(),
				descripcion: form.descripcion.trim(),
				lugar: form.lugar.trim() || null,
				fechaEvento: fechaCompleta.toISOString(),
				categoria: form.categoria,
			});
			showMsg('Evento creado exitosamente');
			setShowCrear(false);
			setForm({ titulo: '', descripcion: '', lugar: '', fechaEvento: '', horaEvento: '', categoria: 'academico' });
			await cargarEventos(filtro);
		} catch (err: any) {
			setCrearError(err.message || 'Error al crear el evento');
		} finally {
			setCreandoEvento(false);
		}
	};

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				.uc-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; white-space: nowrap; }
				.uc-chip.active { background: #003e70; color: #fff; border-color: #003e70; }
				.uc-chip:not(.active) { background: #f0f4f8; color: #4a6a85; border-color: #dce6ef; }
				.uc-chip:not(.active):hover { border-color: #003e70; color: #003e70; }
				.uc-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
				.uc-modal { background: #fff; border-radius: 18px; padding: 28px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeUp 0.3s ease; }
				.uc-form-input { width: 100%; padding: 11px 13px; border: 1.5px solid #c5d3df; border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; color: #00284d; outline: none; transition: border-color 0.2s; }
				.uc-form-input:focus { border-color: #003e70; }
				.uc-form-textarea { width: 100%; padding: 11px 13px; border: 1.5px solid #c5d3df; border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; color: #00284d; outline: none; resize: vertical; min-height: 80px; transition: border-color 0.2s; }
				.uc-form-textarea:focus { border-color: #003e70; }
				.uc-btn-primary { padding: 11px 20px; background: #003e70; color: #fff; border: none; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.2s; }
				.uc-btn-primary:hover:not(:disabled) { background: #00284d; }
				.uc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
				.uc-btn-secondary { padding: 11px 20px; background: transparent; color: #4a6a85; border: 1.5px solid #c5d3df; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
				.uc-btn-secondary:hover { border-color: #003e70; color: #003e70; }
				.uc-suscribir-btn { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid; font-family: 'Inter', sans-serif; transition: all 0.15s; }
				.uc-suscribir-btn.suscrito { background: #e8f0fe; color: #1a73e8; border-color: #1a73e8; }
				.uc-suscribir-btn:not(.suscrito) { background: transparent; color: #4a6a85; border-color: #c5d3df; }
				.uc-suscribir-btn:hover { opacity: 0.8; }
				@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
				@keyframes spin { to { transform: rotate(360deg); } }
			`}</style>

			{toast && (
				<div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, backgroundColor: toast.type === 'error' ? '#c0392b' : '#27ae60', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
					{toast.msg}
				</div>
			)}

			<div style={s.content}>
				<div style={s.pageHeader}>
					<div>
						<h1 style={s.pageTitle}>Eventos</h1>
						<p style={s.pageSubtitle}>Comunidad Universidad de Caldas</p>
					</div>
					<button className="uc-btn-primary" onClick={() => setShowCrear(true)}>+ Publicar evento</button>
				</div>

				{/* Filtros por categoría */}
				<div style={s.filtrosWrap}>
					<div style={s.chipRow}>
						{CATEGORIAS.map((cat) => (
							<button key={cat.value} className={`uc-chip${filtro === cat.value ? ' active' : ''}`} onClick={() => aplicarFiltro(cat.value)}>
								{cat.icon} {cat.label}
							</button>
						))}
					</div>
					{filtro !== 'todas' && (
						<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
							<span style={{ fontSize: 13, color: '#4a6a85' }}>
								{categoriasSuscritas.has(filtro as CategoriaEvento) ? '✓ Suscrito a esta categoría' : 'Recibir notificaciones de esta categoría'}
							</span>
							<button
								className={`uc-suscribir-btn${categoriasSuscritas.has(filtro as CategoriaEvento) ? ' suscrito' : ''}`}
								onClick={() => toggleSuscripcion(filtro as CategoriaEvento)}
							>
								{categoriasSuscritas.has(filtro as CategoriaEvento) ? 'Desuscribirse' : 'Suscribirse 🔔'}
							</button>
						</div>
					)}
				</div>

				{loading && (
					<div style={s.centered}>
						<div style={s.spinner} />
						<p style={{ color: '#7a9ab5', marginTop: 12 }}>Cargando eventos...</p>
					</div>
				)}
				{error && !loading && <div style={s.errorBox}>⚠️ {error}</div>}

				{!loading && !error && (
					<>
						{eventos.length === 0 ? (
							<div style={s.emptyState}>
								<span style={{ fontSize: 44 }}>📅</span>
								<p style={{ fontSize: 15, color: '#7a9ab5', margin: '12px 0 0' }}>No hay eventos próximos en este momento.</p>
							</div>
						) : (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
								{eventos.map((ev) => {
									const badgeStyle = BADGE_COLORS[ev.categoria] ?? BADGE_COLORS.otro;
									return (
										<div key={ev.id} style={s.card}>
											<div style={s.cardHeader}>
												<h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#00284d', flex: 1 }}>{ev.titulo}</h3>
												<span style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
													{CATEGORIAS.find(c => c.value === ev.categoria)?.icon} {CATEGORIAS.find(c => c.value === ev.categoria)?.label}
												</span>
											</div>
											<p style={s.cardDate}>📅 {formatearFecha(ev.fechaEvento)}</p>
											<p style={s.cardDesc}>{ev.descripcion}</p>
											<div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
												<span style={s.cardMeta}>📍 {ev.lugar?.trim() || 'Por definir'}</span>
												<span style={s.cardMeta}>👤 Organiza: {ev.creador.nombre} {ev.creador.apellido}</span>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</>
				)}
			</div>

			{/* Modal crear evento */}
			{showCrear && (
				<div className="uc-modal-overlay" onClick={() => setShowCrear(false)}>
					<div className="uc-modal" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
							<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#00284d' }}>📅 Publicar evento</h2>
							<button onClick={() => setShowCrear(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#7a9ab5' }}>✕</button>
						</div>
						<form onSubmit={handleCrearEvento}>
							<div style={{ marginBottom: 14 }}>
								<label style={s.label}>Título *</label>
								<input className="uc-form-input" placeholder="Nombre del evento" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} disabled={creandoEvento} />
							</div>
							<div style={{ marginBottom: 14 }}>
								<label style={s.label}>Descripción *</label>
								<textarea className="uc-form-textarea" placeholder="Describe el evento..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} disabled={creandoEvento} />
							</div>
							<div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
								<div style={{ flex: 1 }}>
									<label style={s.label}>Fecha *</label>
									<input type="date" className="uc-form-input" value={form.fechaEvento} onChange={(e) => setForm({ ...form, fechaEvento: e.target.value })} disabled={creandoEvento} />
								</div>
								<div style={{ flex: 1 }}>
									<label style={s.label}>Hora *</label>
									<input type="time" className="uc-form-input" value={form.horaEvento} onChange={(e) => setForm({ ...form, horaEvento: e.target.value })} disabled={creandoEvento} />
								</div>
							</div>
							<div style={{ marginBottom: 14 }}>
								<label style={s.label}>Lugar</label>
								<input className="uc-form-input" placeholder="Aula, edificio, virtual..." value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} disabled={creandoEvento} />
							</div>
							<div style={{ marginBottom: 20 }}>
								<label style={s.label}>Categoría</label>
								<select className="uc-form-input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaEvento })} disabled={creandoEvento} style={{ cursor: 'pointer' }}>
									{CATEGORIAS.filter(c => c.value !== 'todas').map((c) => (
										<option key={c.value} value={c.value}>{c.icon} {c.label}</option>
									))}
								</select>
							</div>
							{crearError && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>⚠️ {crearError}</p>}
							<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
								<button type="button" className="uc-btn-secondary" onClick={() => setShowCrear(false)} disabled={creandoEvento}>Cancelar</button>
								<button type="submit" className="uc-btn-primary" disabled={creandoEvento}>{creandoEvento ? '...' : 'Publicar'}</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	page: { minHeight: '100%', backgroundColor: '#f0f4f8', fontFamily: "'Inter', sans-serif" },
	content: { maxWidth: 760, margin: '0 auto', padding: '32px 20px 48px' },
	pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
	pageTitle: { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#00284d' },
	pageSubtitle: { margin: 0, fontSize: 14, color: '#7a9ab5' },
	filtrosWrap: { marginBottom: 24 },
	chipRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
	centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0' },
	spinner: { width: 36, height: 36, border: '3px solid #dce6ef', borderTopColor: theme.colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
	errorBox: { backgroundColor: '#fdf0f0', border: '1px solid #f5c6cb', borderRadius: 10, padding: '14px 18px', color: '#c0392b', fontSize: 14 },
	emptyState: { textAlign: 'center', padding: '64px 0' },
	card: { backgroundColor: '#fff', border: '1px solid #e8eef4', borderRadius: 14, padding: '20px 22px' },
	cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
	cardDate: { margin: '0 0 8px', fontSize: 13, color: '#1a73e8', fontWeight: 600 },
	cardDesc: { margin: '0', fontSize: 14, color: '#4a6a85', lineHeight: 1.5 },
	cardMeta: { fontSize: 13, color: '#7a9ab5' },
	label: { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#00284d' },
};