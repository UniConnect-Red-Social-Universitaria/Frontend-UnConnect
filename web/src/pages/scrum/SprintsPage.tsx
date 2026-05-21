import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '@uniconnect/theme';
import { sprintService } from '../../services/sprint.service';
import type { Sprint, SprintEstado } from '../../types/api.types';

const ESTADO_CONFIG: Record<SprintEstado, { label: string; color: string; bg: string }> = {
	PLANEACION: { label: 'Planeación', color: '#f39c12', bg: '#fef9e7' },
	ACTIVO: { label: 'Activo', color: '#27ae60', bg: '#eafaf1' },
	COMPLETADO: { label: 'Completado', color: '#003e70', bg: '#e8f0f8' },
	CANCELADO: { label: 'Cancelado', color: '#c0392b', bg: '#fdf0f0' },
};

function formatearFecha(fecha?: string): string {
	if (!fecha) return '—';
	return new Date(fecha).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

export default function SprintsPage() {
	const navigate = useNavigate();
	const [sprints, setSprints] = useState<Sprint[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filtro, setFiltro] = useState<'todos' | 'activos'>('todos');
	const [showCrear, setShowCrear] = useState(false);
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
	const [creando, setCreando] = useState(false);

	const [form, setForm] = useState({ numero: 1, nombre: '', descripcion: '', velocidadPlaneada: 40 });

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	const cargarSprints = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = filtro === 'activos' ? await sprintService.listar(true) : await sprintService.listar();
			setSprints(data);
		} catch (err: any) {
			setError(err.message || 'Error al cargar sprints');
		} finally {
			setLoading(false);
		}
	}, [filtro]);

	useEffect(() => { void cargarSprints(); }, [cargarSprints]);

	const handleCrear = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.nombre.trim()) { showMsg('El nombre es obligatorio', 'error'); return; }
		setCreando(true);
		try {
			await sprintService.crear(form);
			showMsg('Sprint creado exitosamente');
			setShowCrear(false);
			setForm({ numero: sprints.length + 1, nombre: '', descripcion: '', velocidadPlaneada: 40 });
			await cargarSprints();
		} catch (err: any) {
			showMsg(err.message || 'Error al crear sprint', 'error');
		} finally {
			setCreando(false);
		}
	};

	const handleIniciar = async (sprintId: string) => {
		try {
			await sprintService.iniciar(sprintId);
			showMsg('Sprint iniciado');
			await cargarSprints();
		} catch (err: any) {
			showMsg(err.message || 'Error al iniciar sprint', 'error');
		}
	};

	const handleCerrar = async (sprintId: string) => {
		try {
			await sprintService.cerrar(sprintId);
			showMsg('Sprint cerrado');
			await cargarSprints();
		} catch (err: any) {
			showMsg(err.message || 'Error al cerrar sprint', 'error');
		}
	};

	return (
		<div style={s.page}>
			<style>{`
				* { box-sizing: border-box; }
				.uc-btn-p { padding: 10px 18px; background: #003e70; color: #fff; border: none; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.2s; }
				.uc-btn-p:hover { background: #00284d; }
				.uc-btn-s { padding: 8px 16px; background: transparent; color: #4a6a85; border: 1.5px solid #c5d3df; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
				.uc-btn-s:hover { border-color: #003e70; color: #003e70; }
				.uc-btn-d { padding: 6px 14px; background: transparent; color: #27ae60; border: 1.5px solid #27ae60; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
				.uc-btn-d:hover { background: #27ae60; color: #fff; }
				.uc-chip-f { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; white-space: nowrap; }
				.uc-chip-f.active { background: #003e70; color: #fff; border-color: #003e70; }
				.uc-chip-f:not(.active) { background: #f0f4f8; color: #4a6a85; border-color: #dce6ef; }
				.uc-modal-o { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
				.uc-modal-c { background: #fff; border-radius: 18px; padding: 28px; max-width: 480px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeUp 0.3s ease; }
				.uc-inp { width: 100%; padding: 11px 13px; border: 1.5px solid #c5d3df; border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; color: #00284d; outline: none; transition: border-color 0.2s; }
				.uc-inp:focus { border-color: #003e70; }
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
						<h1 style={s.pageTitle}>Sprints</h1>
						<p style={s.pageSubtitle}>Gestión de sprints Scrum</p>
					</div>
					<button className="uc-btn-p" onClick={() => setShowCrear(true)}>+ Nuevo Sprint</button>
				</div>

				<div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
					<button className={`uc-chip-f${filtro === 'todos' ? ' active' : ''}`} onClick={() => setFiltro('todos')}>Todos</button>
					<button className={`uc-chip-f${filtro === 'activos' ? ' active' : ''}`} onClick={() => setFiltro('activos')}>Activos</button>
				</div>

				{loading && (
					<div style={s.centered}>
						<div style={s.spinner} />
						<p style={{ color: '#7a9ab5', marginTop: 12 }}>Cargando sprints...</p>
					</div>
				)}
				{error && !loading && <div style={s.errorBox}>⚠️ {error}</div>}

				{!loading && !error && sprints.length === 0 && (
					<div style={s.emptyState}>
						<span style={{ fontSize: 44 }}>📋</span>
						<p style={{ fontSize: 15, color: '#7a9ab5', margin: '12px 0 0' }}>No hay sprints aún. Crea el primero.</p>
					</div>
				)}

				{!loading && !error && sprints.length > 0 && (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{sprints.map((sp) => {
							const cfg = ESTADO_CONFIG[sp.estado];
							return (
								<div
									key={sp.id}
									style={s.card}
									onClick={() => navigate(`/scrum/sprint/${sp.id}`)}
									className="uc-sprint-card"
								>
									<div style={s.cardTop}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
											<span style={{ fontWeight: 700, fontSize: 15, color: '#00284d' }}>
												Sprint {sp.numero}: {sp.nombre}
											</span>
											<span style={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
												{cfg.label}
											</span>
										</div>
										<div style={{ display: 'flex', gap: 8 }}>
											{sp.estado === 'PLANEACION' && (
												<button className="uc-btn-d" onClick={(e) => { e.stopPropagation(); handleIniciar(sp.id); }}>▶ Iniciar</button>
											)}
											{sp.estado === 'ACTIVO' && (
												<button className="uc-btn-s" onClick={(e) => { e.stopPropagation(); handleCerrar(sp.id); }}>■ Cerrar</button>
											)}
										</div>
									</div>
									{sp.descripcion && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7a9ab5' }}>{sp.descripcion}</p>}
									<div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 13, color: '#4a6a85' }}>
										<span>📅 {formatearFecha(sp.fechaInicio)} — {formatearFecha(sp.fechaFin)}</span>
										<span>⚡ {sp.velocidadPlaneada} SP</span>
										{sp.velocidadReal != null && <span>✅ {sp.velocidadReal} SP real</span>}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{showCrear && (
				<div className="uc-modal-o" onClick={() => setShowCrear(false)}>
					<div className="uc-modal-c" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
							<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#00284d' }}>📋 Nuevo Sprint</h2>
							<button onClick={() => setShowCrear(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#7a9ab5' }}>✕</button>
						</div>
						<form onSubmit={handleCrear}>
							<div style={{ marginBottom: 14 }}>
								<label style={s.label}>Número *</label>
								<input type="number" className="uc-inp" min={1} value={form.numero} onChange={(e) => setForm({ ...form, numero: parseInt(e.target.value) || 1 })} disabled={creando} />
							</div>
							<div style={{ marginBottom: 14 }}>
								<label style={s.label}>Nombre *</label>
								<input className="uc-inp" placeholder="Sprint 1 - Autenticación" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} disabled={creando} />
							</div>
							<div style={{ marginBottom: 14 }}>
								<label style={s.label}>Descripción</label>
								<textarea className="uc-inp" style={{ minHeight: 70, resize: 'vertical' }} placeholder="Objetivos del sprint..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} disabled={creando} />
							</div>
							<div style={{ marginBottom: 20 }}>
								<label style={s.label}>Velocidad Planeada (SP) *</label>
								<input type="number" className="uc-inp" min={1} value={form.velocidadPlaneada} onChange={(e) => setForm({ ...form, velocidadPlaneada: parseInt(e.target.value) || 1 })} disabled={creando} />
							</div>
							<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
								<button type="button" className="uc-btn-s" onClick={() => setShowCrear(false)} disabled={creando}>Cancelar</button>
								<button type="submit" className="uc-btn-p" disabled={creando}>{creando ? '...' : 'Crear Sprint'}</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<style>{`
				.uc-sprint-card { cursor: pointer; transition: box-shadow 0.2s, transform 0.15s; }
				.uc-sprint-card:hover { box-shadow: 0 4px 16px rgba(0,62,112,0.10); transform: translateY(-1px); }
			`}</style>
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	page: { minHeight: '100%', backgroundColor: '#f0f4f8', fontFamily: "'Inter', sans-serif" },
	content: { maxWidth: 800, margin: '0 auto', padding: '32px 20px 48px' },
	pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
	pageTitle: { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#00284d' },
	pageSubtitle: { margin: 0, fontSize: 14, color: '#7a9ab5' },
	centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0' },
	spinner: { width: 36, height: 36, border: '3px solid #dce6ef', borderTopColor: theme.colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
	errorBox: { backgroundColor: '#fdf0f0', border: '1px solid #f5c6cb', borderRadius: 10, padding: '14px 18px', color: '#c0392b', fontSize: 14 },
	emptyState: { textAlign: 'center', padding: '64px 0' },
	card: { backgroundColor: '#fff', border: '1px solid #e8eef4', borderRadius: 14, padding: '18px 20px' },
	cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
	label: { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#00284d' },
};
