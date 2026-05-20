import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import theme from '@uniconnect/theme';
import { sprintService } from '../../services/sprint.service';
import { historiaUsuarioService } from '../../services/historia-usuario.service';
import { criterioAceptacionService } from '../../services/criterio-aceptacion.service';
import { metricasService } from '../../services/metricas.service';
import { trazabilidadService } from '../../services/trazabilidad.service';
import { retrospectivaService } from '../../services/retrospectiva.service';
import { impedimentoService } from '../../services/impedimento.service';
import { exportacionService } from '../../services/exportacion.service';
import type {
	Sprint, HistoriaUsuario, HUEstado, CriterioAceptacion,
	MetricasSprint, BurnDownData, CumplimientoSprint, VelocidadHistorica,
	TrazabilidadHU, Retrospectiva, Impedimento, ImpedimentoEstado,
} from '../../types/api.types';

type Tab = 'panel' | 'metricas' | 'criterios' | 'trazabilidad' | 'retrospectiva' | 'impedimentos' | 'exportar';

const TABS: { id: Tab; label: string }[] = [
	{ id: 'panel', label: 'Panel' },
	{ id: 'metricas', label: 'Métricas' },
	{ id: 'criterios', label: 'Criterios' },
	{ id: 'trazabilidad', label: 'Trazabilidad' },
	{ id: 'retrospectiva', label: 'Retrospectiva' },
	{ id: 'impedimentos', label: 'Impedimentos' },
	{ id: 'exportar', label: 'Exportar' },
];

const ESTADO_HU_COLORS: Record<HUEstado, { label: string; color: string; bg: string }> = {
	PENDIENTE: { label: 'Pendiente', color: '#7a9ab5', bg: '#f0f4f8' },
	EN_PROGRESO: { label: 'En Progreso', color: '#1a73e8', bg: '#e8f0fe' },
	BLOQUEADA: { label: 'Bloqueada', color: '#c0392b', bg: '#fdf0f0' },
	COMPLETADA: { label: 'Completada', color: '#27ae60', bg: '#eafaf1' },
	CANCELADA: { label: 'Cancelada', color: '#95a5a6', bg: '#f5f5f5' },
};

const IMPEDIMENTO_ESTADO_CONFIG: Record<ImpedimentoEstado, { label: string; color: string }> = {
	ABIERTO: { label: 'Abierto', color: '#e74c3c' },
	EN_PROGRESO: { label: 'En Progreso', color: '#f39c12' },
	RESUELTO: { label: 'Resuelto', color: '#27ae60' },
	CERRADO: { label: 'Cerrado', color: '#7a9ab5' },
};

function formatearFecha(fecha?: string): string {
	if (!fecha) return '—';
	const d = new Date(fecha);
	if (isNaN(d.getTime())) return '—';
	return d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

function formatearFechaHora(fecha?: string): string {
	if (!fecha) return '—';
	const d = new Date(fecha);
	if (isNaN(d.getTime())) return '—';
	return d.toLocaleDateString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

// ── SVG BurnDown Chart ──
function BurnDownChartSVG({ data }: { data: BurnDownData }) {
	if (!data.dias?.length) return <p style={{ color: '#7a9ab5', fontSize: 14 }}>Sin datos de burn-down</p>;
	const w = 500, h = 220, pad = 40;
	const dias = data.dias;
	const maxSp = Math.max(...dias.map(d => d.spRestantesIdeal), ...dias.map(d => d.spRestantesReal), 1);
	const xScale = (i: number) => pad + (i / Math.max(dias.length - 1, 1)) * (w - pad * 2);
	const yScale = (v: number) => h - pad - (v / maxSp) * (h - pad * 2);

	const idealLine = dias.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.spRestantesIdeal)}`).join(' ');
	const realLine = dias.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.spRestantesReal)}`).join(' ');

	return (
		<svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, height: 'auto' }}>
			{/* Grid */}
			{[0, 0.25, 0.5, 0.75, 1].map((frac) => (
				<line key={frac} x1={pad} y1={yScale(frac * maxSp)} x2={w - pad} y2={yScale(frac * maxSp)} stroke="#e8eef4" strokeWidth={1} />
			))}
			{/* Ideal */}
			<path d={idealLine} fill="none" stroke="#7a9ab5" strokeWidth={2} strokeDasharray="6 4" />
			{/* Real */}
			<path d={realLine} fill="none" stroke="#003e70" strokeWidth={2.5} />
			{/* Points */}
			{dias.map((d, i) => (
				<circle key={i} cx={xScale(i)} cy={yScale(d.spRestantesReal)} r={3.5} fill="#003e70" />
			))}
			{/* Labels */}
			<text x={w / 2} y={h - 4} fill="#7a9ab5" fontSize={10} textAnchor="middle">Días</text>
			<text x={8} y={h / 2} fill="#7a9ab5" fontSize={10} textAnchor="middle" transform={`rotate(-90, 8, ${h / 2})`}>SP</text>
			<text x={w - pad} y={pad + 12} fill="#7a9ab5" fontSize={11} textAnchor="end">Ideal</text>
			<text x={w - pad} y={pad + 26} fill="#003e70" fontSize={11} textAnchor="end">Real</text>
		</svg>
	);
}

// ── SVG Velocidad Histórica ──
function VelocidadChartSVG({ data }: { data: VelocidadHistorica[] }) {
	if (!data.length) return <p style={{ color: '#7a9ab5', fontSize: 14 }}>Sin datos históricos</p>;
	const w = 500, h = 200, pad = 40;
	const max = Math.max(...data.map(d => Math.max(d.velocidadPlaneada, d.velocidadReal)), 1);
	const barW = (w - pad * 2) / data.length / 2 - 4;

	const yScale = (v: number) => h - pad - (v / max) * (h - pad * 2);

	return (
		<svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, height: 'auto' }}>
			{[0, 0.25, 0.5, 0.75, 1].map((frac) => (
				<line key={frac} x1={pad} y1={yScale(frac * max)} x2={w - pad} y2={yScale(frac * max)} stroke="#e8eef4" strokeWidth={1} />
			))}
			{data.map((d, i) => {
				const x = pad + i * ((w - pad * 2) / data.length);
				return (
					<g key={d.sprintId}>
						<rect x={x} y={yScale(d.velocidadPlaneada)} width={barW} height={yScale(0) - yScale(d.velocidadPlaneada)} fill="#c5d3df" rx={3} />
						<rect x={x + barW} y={yScale(d.velocidadReal)} width={barW} height={yScale(0) - yScale(d.velocidadReal)} fill="#003e70" rx={3} />
						<text x={x + barW} y={h - 6} fill="#7a9ab5" fontSize={8} textAnchor="middle">{d.numero}</text>
					</g>
				);
			})}
			<text x={pad} y={12} fill="#7a9ab5" fontSize={10}>Planeado</text>
			<rect x={pad + 52} y={4} width={12} height={8} fill="#c5d3df" rx={2} />
			<text x={pad + 68} y={12} fill="#003e70" fontSize={10}>Real</text>
			<rect x={pad + 98} y={4} width={12} height={8} fill="#003e70" rx={2} />
		</svg>
	);
}

// ── Pie Chart simple ──
function PieChartSVG({ values, colors }: { values: { label: string; value: number; color: string }[] }) {
	const total = values.reduce((s, v) => s + v.value, 0) || 1;
	const r = 80, cx = 100, cy = 80;
	let acc = 0;
	const pieces = values.filter(v => v.value > 0).map((v) => {
		const p = (v.value / total) * 360;
		const start = acc;
		acc += p;
		const end = acc;
		const sr = ((start - 90) * Math.PI) / 180;
		const er = ((end - 90) * Math.PI) / 180;
		const x1 = cx + r * Math.cos(sr), y1 = cy + r * Math.sin(sr);
		const x2 = cx + r * Math.cos(er), y2 = cy + r * Math.sin(er);
		const large = p > 180 ? 1 : 0;
		return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: v.color, label: v.label, value: v.value, pct: Math.round((v.value / total) * 100) };
	});

	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
			<svg width="160" height="160" viewBox="0 0 200 160">
				{pieces.map((p, i) => <path key={i} d={p.d} fill={p.color} stroke="#fff" strokeWidth={2} />)}
			</svg>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
				{values.map((v) => (
					<div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4a6a85' }}>
						<span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: v.color, display: 'inline-block' }} />
						<span>{v.label}: {v.value}</span>
					</div>
				))}
			</div>
		</div>
	);
}

export default function SprintDashboardPage() {
	const { sprintId } = useParams<{ sprintId: string }>();
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab>('panel');

	// Data states
	const [sprint, setSprint] = useState<Sprint | null>(null);
	const [historias, setHistorias] = useState<HistoriaUsuario[]>([]);
	const [metricas, setMetricas] = useState<MetricasSprint | null>(null);
	const [burndown, setBurndown] = useState<BurnDownData | null>(null);
	const [cumplimiento, setCumplimiento] = useState<CumplimientoSprint | null>(null);
	const [velocidadHistorica, setVelocidadHistorica] = useState<VelocidadHistorica[]>([]);
	const [trazabilidad, setTrazabilidad] = useState<Record<string, TrazabilidadHU>>({});
	const [retrospectiva, setRetrospectiva] = useState<Retrospectiva | null>(null);
	const [impedimentos, setImpedimentos] = useState<Impedimento[]>([]);
	const [criteriosMap, setCriteriosMap] = useState<Record<string, CriterioAceptacion[]>>({});
	const [cumplimientoMap, setCumplimientoMap] = useState<Record<string, { cumplidos: number; total: number; porcentaje: number }>>({});
	const [usuarios, setUsuarios] = useState<Record<string, string>>({});

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

	// Modals
	const [showCrearHU, setShowCrearHU] = useState(false);
	const [showEditHU, setShowEditHU] = useState<HistoriaUsuario | null>(null);
	const [showCriterios, setShowCriterios] = useState<HistoriaUsuario | null>(null);
	const [showLinkTrazabilidad, setShowLinkTrazabilidad] = useState<string | null>(null);
	const [showCrearRetro, setShowCrearRetro] = useState(false);
	const [showCrearImpedimento, setShowCrearImpedimento] = useState(false);
	const [showExportPDF, setShowExportPDF] = useState(false);

	// Forms
	const [huForm, setHuForm] = useState({ codigo: '', titulo: '', descripcion: '', storyPoints: 5, prioridad: 1 });
	const [criterioForm, setCriterioForm] = useState({ descripcion: '' });
	const [trazabilidadForm, setTrazabilidadForm] = useState({ repositorio: 'BACKEND' as 'BACKEND' | 'FRONTEND', nombreRepositorio: '', shaCommit: '', urlCommit: '', mensajeCommit: '', numeroPR: '', urlPR: '', estadoPR: 'MERGED' });
	const [retroForm, setRetroForm] = useState({ fechaRetrospectiva: new Date().toISOString().split('T')[0], comentariosGenerales: '', acuerdoDesc: '', acuerdoResp: '', impedimentoDesc: '', impedimentoImpacto: 'Medio', impedimentoResp: '' });
	const [impForm, setImpForm] = useState({ descripcion: '', responsable: '' });

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

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

			// Load criteria for each HU
			const critMap: Record<string, CriterioAceptacion[]> = {};
			const cumplMap: Record<string, { cumplidos: number; total: number; porcentaje: number }> = {};
			await Promise.all(hus.map(async (hu) => {
				try {
					critMap[hu.id] = await criterioAceptacionService.listarPorHU(hu.id);
				} catch { critMap[hu.id] = []; }
				try {
					cumplMap[hu.id] = await criterioAceptacionService.cumplimientoHU(hu.id);
				} catch { cumplMap[hu.id] = { cumplidos: 0, total: 0, porcentaje: 0 }; }
			}));
			setCriteriosMap(critMap);
			setCumplimientoMap(cumplMap);

			// Load trazabilidad
			const trazMap: Record<string, TrazabilidadHU> = {};
			await Promise.all(hus.map(async (hu) => {
				try { trazMap[hu.id] = await trazabilidadService.obtenerPorHU(hu.id); } catch { }
			}));
			setTrazabilidad(trazMap);

		} catch (err: any) {
			setError(err.message || 'Error al cargar datos del sprint');
		} finally {
			setLoading(false);
		}
	}, [sprintId]);

	useEffect(() => { void cargarTodo(); }, [cargarTodo]);

	// ── Handlers ──

	const handleCrearHU = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!sprintId || !huForm.titulo.trim()) return;
		try {
			await historiaUsuarioService.crear(sprintId, huForm);
			showMsg('Historia de usuario creada');
			setShowCrearHU(false);
			setHuForm({ codigo: `HU-${(historias.length + 1).toString().padStart(3, '0')}`, titulo: '', descripcion: '', storyPoints: 5, prioridad: 1 });
			await cargarTodo();
		} catch (err: any) { showMsg(err.message || 'Error', 'error'); }
	};

	const handleCambiarEstadoHU = async (huId: string, estado: HUEstado) => {
		try {
			await historiaUsuarioService.cambiarEstado(huId, estado);
			showMsg('Estado actualizado');
			await cargarTodo();
		} catch (err: any) { showMsg(err.message, 'error'); }
	};

	const handleEvaluarCriterio = async (criterioId: string, cumplido: boolean) => {
		try {
			await criterioAceptacionService.evaluar(criterioId, cumplido);
			showMsg('Criterio evaluado');
			if (showCriterios) {
				const crits = await criterioAceptacionService.listarPorHU(showCriterios.id);
				setCriteriosMap((prev) => ({ ...prev, [showCriterios.id]: crits }));
				const c = await criterioAceptacionService.cumplimientoHU(showCriterios.id);
				setCumplimientoMap((prev) => ({ ...prev, [showCriterios.id]: c }));
			}
		} catch (err: any) { showMsg(err.message, 'error'); }
	};

	const handleCrearCriterio = async (huId: string) => {
		if (!criterioForm.descripcion.trim()) return;
		try {
			const crits = criteriosMap[huId] || [];
			await criterioAceptacionService.crear(huId, { numero: crits.length + 1, descripcion: criterioForm.descripcion });
			showMsg('Criterio creado');
			setCriterioForm({ descripcion: '' });
			const updated = await criterioAceptacionService.listarPorHU(huId);
			setCriteriosMap((prev) => ({ ...prev, [huId]: updated }));
		} catch (err: any) { showMsg(err.message, 'error'); }
	};

	const handleLinkTrazabilidad = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!showLinkTrazabilidad) return;
		try {
			await trazabilidadService.linkear({
				huId: showLinkTrazabilidad,
				repositorio: trazabilidadForm.repositorio,
				nombreRepositorio: trazabilidadForm.nombreRepositorio || trazabilidadForm.repositorio,
				shaCommit: trazabilidadForm.shaCommit || undefined,
				urlCommit: trazabilidadForm.urlCommit || undefined,
				mensajeCommit: trazabilidadForm.mensajeCommit || undefined,
				numeroPR: trazabilidadForm.numeroPR ? parseInt(trazabilidadForm.numeroPR) : undefined,
				urlPR: trazabilidadForm.urlPR || undefined,
				estadoPR: trazabilidadForm.estadoPR || undefined,
			});
			showMsg('Trazabilidad vinculada');
			setShowLinkTrazabilidad(null);
			if (showLinkTrazabilidad) {
				try { const t = await trazabilidadService.obtenerPorHU(showLinkTrazabilidad); setTrazabilidad((prev) => ({ ...prev, [showLinkTrazabilidad]: t })); } catch { }
			}
		} catch (err: any) { showMsg(err.message, 'error'); }
	};

	const handleCrearRetrospectiva = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!sprintId) return;
		try {
			await retrospectivaService.crear(sprintId, {
				fechaRetrospectiva: new Date(retroForm.fechaRetrospectiva).toISOString(),
				comentariosGenerales: retroForm.comentariosGenerales || undefined,
				acuerdos: retroForm.acuerdoDesc ? [{ descripcion: retroForm.acuerdoDesc, responsable: retroForm.acuerdoResp || undefined }] : undefined,
				impedimentos: retroForm.impedimentoDesc ? [{ descripcion: retroForm.impedimentoDesc, impacto: retroForm.impedimentoImpacto, responsable: retroForm.impedimentoResp || undefined }] : undefined,
			});
			showMsg('Retrospectiva creada');
			setShowCrearRetro(false);
			const retro = await retrospectivaService.obtener(sprintId);
			setRetrospectiva(retro);
		} catch (err: any) { showMsg(err.message, 'error'); }
	};

	const handleCrearImpedimento = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!impForm.descripcion.trim()) return;
		try {
			await impedimentoService.crear({ ...impForm, sprintId });
			showMsg('Impedimento registrado');
			setShowCrearImpedimento(false);
			setImpForm({ descripcion: '', responsable: '' });
			const imps = sprintId ? await impedimentoService.listarPorSprint(sprintId) : [];
			setImpedimentos(imps);
		} catch (err: any) { showMsg(err.message, 'error'); }
	};

	const handleCambiarEstadoImpedimento = async (id: string, estado: ImpedimentoEstado) => {
		try {
			await impedimentoService.actualizarEstado(id, estado);
			showMsg('Estado actualizado');
			const imps = sprintId ? await impedimentoService.listarPorSprint(sprintId) : [];
			setImpedimentos(imps);
		} catch (err: any) { showMsg(err.message, 'error'); }
	};

	const handleExportCSV = (tipo: 'historias' | 'criterios' | 'impedimentos') => {
		if (!sprintId) return;
		exportacionService.descargarCSV(sprintId, tipo).catch((err) => showMsg(err.message, 'error'));
	};

	const handleExportPDF = (opciones: { trazabilidad?: boolean; retrospectiva?: boolean; impedimentos?: boolean }) => {
		if (!sprintId) return;
		exportacionService.descargarPDF(sprintId, opciones).catch((err) => showMsg(err.message, 'error'));
		setShowExportPDF(false);
	};

	if (!sprintId) return <div style={s.page}><p style={{ padding: 40, color: '#c0392b' }}>ID de sprint no especificado</p></div>;

	const estadoSP = sprint ? ESTADO_HU_COLORS[sprint.estado === 'PLANEACION' ? 'PENDIENTE' : sprint.estado === 'ACTIVO' ? 'EN_PROGRESO' : sprint.estado === 'COMPLETADO' ? 'COMPLETADA' : 'CANCELADA'] : null;

	const KANBAN_COLUMNAS: HUEstado[] = ['PENDIENTE', 'EN_PROGRESO', 'BLOQUEADA', 'COMPLETADA'];

	return (
		<div style={s.page}>
			<style>{`
				* { box-sizing: border-box; }
				.uc-btn-p { padding: 10px 18px; background: #003e70; color: #fff; border: none; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.2s; }
				.uc-btn-p:hover { background: #00284d; }
				.uc-btn-p-sm { padding: 7px 14px; background: #003e70; color: #fff; border: none; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.2s; }
				.uc-btn-p-sm:hover { background: #00284d; }
				.uc-btn-s { padding: 8px 16px; background: transparent; color: #4a6a85; border: 1.5px solid #c5d3df; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
				.uc-btn-s:hover { border-color: #003e70; color: #003e70; }
				.uc-btn-sm { padding: 5px 10px; background: transparent; color: #4a6a85; border: 1px solid #c5d3df; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; }
				.uc-btn-sm:hover { border-color: #003e70; color: #003e70; }
				.uc-inp { width: 100%; padding: 10px 12px; border: 1.5px solid #c5d3df; border-radius: 8px; font-size: 13px; font-family: 'Inter', sans-serif; color: #00284d; outline: none; transition: border-color 0.2s; }
				.uc-inp:focus { border-color: #003e70; }
				.uc-inp-sm { padding: 7px 10px; font-size: 12px; }
				.uc-modal-o { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
				.uc-modal-c { background: #fff; border-radius: 18px; padding: 24px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeUp 0.3s ease; }
				@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
				@keyframes spin { to { transform: rotate(360deg); } }
			`}</style>

			{toast && (
				<div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, backgroundColor: toast.type === 'error' ? '#c0392b' : '#27ae60', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
					{toast.msg}
				</div>
			)}

			<div style={s.content}>
				{/* ── Sprint Header ── */}
				{sprint && (
					<div style={s.sprintHeader}>
						<div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
								<button className="uc-btn-sm" onClick={() => navigate('/scrum')}>← Volver</button>
								<h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#00284d' }}>
									Sprint {sprint.numero}: {sprint.nombre}
								</h1>
								{estadoSP && <span style={{ backgroundColor: estadoSP.bg, color: estadoSP.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{estadoSP.label}</span>}
							</div>
							<div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#4a6a85', flexWrap: 'wrap' }}>
								<span>📅 {formatearFecha(sprint.fechaInicio)} — {formatearFecha(sprint.fechaFin)}</span>
								<span>⚡ {sprint.velocidadPlaneada} SP planeados</span>
								{sprint.velocidadReal != null && <span>✅ {sprint.velocidadReal} SP reales</span>}
							</div>
						</div>
					</div>
				)}

				{/* ── Loading / Error ── */}
				{loading && (
					<div style={s.centered}>
						<div style={s.spinner} />
						<p style={{ color: '#7a9ab5', marginTop: 12 }}>Cargando...</p>
					</div>
				)}
				{error && !loading && <div style={s.errorBox}>⚠️ {error}</div>}

				{!loading && !error && sprint && (
					<>
						{/* ── Tab Navigation ── */}
						<div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '2px solid #dce6ef', overflowX: 'auto' }}>
							{TABS.map((t) => (
								<button
									key={t.id}
									onClick={() => setTab(t.id)}
									style={{
										padding: '10px 16px',
										fontSize: 13,
										fontWeight: tab === t.id ? 700 : 500,
										color: tab === t.id ? '#003e70' : '#4a6a85',
										background: 'none',
										border: 'none',
										borderBottom: `3px solid ${tab === t.id ? '#003e70' : 'transparent'}`,
										cursor: 'pointer',
										fontFamily: "'Inter', sans-serif",
										whiteSpace: 'nowrap',
										transition: 'all 0.15s',
									}}
								>
									{t.label}
								</button>
							))}
						</div>

						{/* ══════════ TAB: PANEL (Kanban) ══════════ */}
						{tab === 'panel' && (
							<div>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
									<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#00284d' }}>Historias de Usuario</h2>
									<button className="uc-btn-p-sm" onClick={() => {
										setHuForm({ codigo: `HU-${(historias.length + 1).toString().padStart(3, '0')}`, titulo: '', descripcion: '', storyPoints: 5, prioridad: 1 });
										setShowCrearHU(true);
									}}>+ HU</button>
								</div>

								{/* Kanban Board */}
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, minHeight: 200 }}>
									{KANBAN_COLUMNAS.map((col) => {
										const cfg = ESTADO_HU_COLORS[col];
										const colHus = historias.filter((h) => h.estado === col);
										return (
											<div key={col} style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, border: '1px solid #e8eef4' }}>
												<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
													<span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg, padding: '3px 10px', borderRadius: 20 }}>{cfg.label}</span>
													<span style={{ fontSize: 12, color: '#7a9ab5' }}>{colHus.length}</span>
												</div>
												<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
													{colHus.map((hu) => {
														const crits = criteriosMap[hu.id] || [];
														const cumpl = cumplimientoMap[hu.id];
														const traz = trazabilidad[hu.id];
														const hasTraz = traz?.trazas && traz.trazas.length > 0;
														return (
															<div key={hu.id} style={{ backgroundColor: '#fff', border: '1px solid #e8eef4', borderRadius: 10, padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
																<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
																	<span style={{ fontSize: 11, fontWeight: 700, color: '#003e70' }}>{hu.codigo}</span>
																	<span style={{ fontSize: 10, color: '#7a9ab5', fontWeight: 600 }}>{hu.storyPoints} SP</span>
																</div>
																<p style={{ margin: '2px 0', fontSize: 12, fontWeight: 600, color: '#00284d', lineHeight: 1.3 }}>{hu.titulo}</p>
																{hu.asignadoA && <p style={{ margin: '2px 0', fontSize: 10, color: '#7a9ab5' }}>👤 {hu.asignadoA}</p>}
																{cumpl && cumpl.total > 0 && (
																	<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
																		<div style={{ flex: 1, height: 4, backgroundColor: '#e8eef4', borderRadius: 2 }}>
																			<div style={{ width: `${cumpl.porcentaje}%`, height: '100%', backgroundColor: cumpl.porcentaje === 100 ? '#27ae60' : '#f39c12', borderRadius: 2 }} />
																		</div>
																		<span style={{ fontSize: 10, color: '#7a9ab5' }}>{cumpl.cumplidos}/{cumpl.total}</span>
																	</div>
																)}
																{hasTraz && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#1a73e8' }}>🔗 {traz!.trazas.length} enlaces</p>}
																<div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
																	{col !== 'COMPLETADA' && col !== 'CANCELADA' && (
																		<select
																			className="uc-inp uc-inp-sm"
																			style={{ width: 'auto', fontSize: 10, padding: '3px 6px' }}
																			value={hu.estado}
																			onChange={(e) => handleCambiarEstadoHU(hu.id, e.target.value as HUEstado)}
																		>
																			{KANBAN_COLUMNAS.filter(c => c !== 'CANCELADA').map((c) => (
																				<option key={c} value={c}>{ESTADO_HU_COLORS[c].label}</option>
																			))}
																		</select>
																	)}
																	<button className="uc-btn-sm" onClick={() => setShowCriterios(hu)}>✓</button>
																	<button className="uc-btn-sm" onClick={() => setShowLinkTrazabilidad(hu.id)}>🔗</button>
																	<button className="uc-btn-sm" onClick={() => setShowEditHU(hu)}>✎</button>
																</div>
															</div>
														);
													})}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* ══════════ TAB: MÉTRICAS ══════════ */}
						{tab === 'metricas' && (
							<div>
								<h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#00284d' }}>Métricas del Sprint</h2>
								{metricas && (
									<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
										{[
											{ label: 'Velocidad Planeada', value: `${metricas.velocidadPlaneada} SP`, color: '#7a9ab5' },
											{ label: 'Velocidad Real', value: `${metricas.velocidadReal} SP`, color: '#003e70' },
											{ label: '% Cumplimiento', value: `${metricas.porcentajeCumplimiento}%`, color: metricas.porcentajeCumplimiento >= 80 ? '#27ae60' : '#e74c3c' },
											{ label: 'HU Completadas', value: `${metricas.huCompletadas}/${metricas.huTotales}`, color: '#27ae60' },
											{ label: 'En Progreso', value: metricas.huEnProgreso.toString(), color: '#1a73e8' },
											{ label: 'Bloqueadas', value: metricas.huBloqueadas.toString(), color: metricas.huBloqueadas > 0 ? '#c0392b' : '#7a9ab5' },
										].map((item) => (
											<div key={item.label} style={s.metricCard}>
												<p style={{ margin: '0 0 4px', fontSize: 12, color: '#7a9ab5' }}>{item.label}</p>
												<p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</p>
											</div>
										))}
									</div>
								)}

								{/* Estado de HUs - Pie Chart */}
								<div style={s.section}>
									<h3 style={s.sectionTitle}>Estado de HU</h3>
									<PieChartSVG
										values={
											['COMPLETADA', 'EN_PROGRESO', 'BLOQUEADA', 'PENDIENTE', 'CANCELADA'].map((e) => ({
												label: ESTADO_HU_COLORS[e as HUEstado].label,
												value: historias.filter((h) => h.estado === e).length,
												color: ESTADO_HU_COLORS[e as HUEstado].color,
											}))
										}
									/>
								</div>

								{/* Cumplimiento global */}
								{cumplimiento && (
									<div style={s.section}>
										<h3 style={s.sectionTitle}>Cumplimiento de Criterios</h3>
										<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
											<div style={{ position: 'relative', width: 80, height: 80 }}>
												<svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
													<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e8eef4" strokeWidth="3" />
													<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#003e70" strokeWidth="3" strokeDasharray={`${cumplimiento.porcentajeCumplimiento}, 100`} />
												</svg>
												<span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#003e70' }}>{Math.round(cumplimiento.porcentajeCumplimiento)}%</span>
											</div>
											<div>
												<p style={{ margin: 0, fontSize: 14, color: '#4a6a85' }}>{cumplimiento.criteriosCumplidos} de {cumplimiento.criteriosTotales} criterios cumplidos</p>
											</div>
										</div>
									</div>
								)}

								{/* Burn-Down Chart */}
								<div style={s.section}>
									<h3 style={s.sectionTitle}>Burn-Down Chart</h3>
									{burndown ? <BurnDownChartSVG data={burndown} /> : <p style={{ color: '#7a9ab5', fontSize: 14 }}>No hay datos de burn-down</p>}
								</div>

								{/* Velocidad Histórica */}
								<div style={s.section}>
									<h3 style={s.sectionTitle}>Velocidad Histórica (últimos sprints)</h3>
									{velocidadHistorica.length > 0 ? <VelocidadChartSVG data={velocidadHistorica} /> : <p style={{ color: '#7a9ab5', fontSize: 14 }}>No hay datos históricos</p>}
								</div>
							</div>
						)}

						{/* ══════════ TAB: CRITERIOS ══════════ */}
						{tab === 'criterios' && (
							<div>
								<h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#00284d' }}>Criterios de Aceptación</h2>
								{historias.length === 0 && <p style={{ color: '#7a9ab5' }}>No hay historias de usuario.</p>}
								{historias.map((hu) => {
									const crits = criteriosMap[hu.id] || [];
									const cumpl = cumplimientoMap[hu.id];
									return (
										<div key={hu.id} style={{ ...s.card, marginBottom: 14 }}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
												<span style={{ fontWeight: 700, fontSize: 14, color: '#00284d' }}>{hu.codigo}: {hu.titulo}</span>
												{cumpl && <span style={{ fontSize: 12, color: cumpl.porcentaje >= 100 ? '#27ae60' : '#f39c12', fontWeight: 600 }}>{cumpl.porcentaje}% cumplido</span>}
											</div>
											{crits.length === 0 && <p style={{ fontSize: 12, color: '#7a9ab5' }}>Sin criterios definidos</p>}
											{crits.map((c) => (
												<div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f0f4f8' }}>
													<button
														onClick={() => handleEvaluarCriterio(c.id, !c.cumplido)}
														style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${c.cumplido ? '#27ae60' : '#c5d3df'}`, background: c.cumplido ? '#27ae60' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, padding: 0 }}
													>
														{c.cumplido ? '✓' : ''}
													</button>
													<span style={{ fontSize: 13, color: '#4a6a85' }}>{c.numero}. {c.descripcion}</span>
												</div>
											))}
										</div>
									);
								})}
							</div>
						)}

						{/* ══════════ TAB: TRAZABILIDAD ══════════ */}
						{tab === 'trazabilidad' && (
							<div>
								<h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#00284d' }}>Trazabilidad GitHub</h2>
								{historias.length === 0 && <p style={{ color: '#7a9ab5' }}>No hay historias de usuario.</p>}
								{historias.map((hu) => {
									const traz = trazabilidad[hu.id];
									const items = traz?.trazas || [];
									return (
										<div key={hu.id} style={{ ...s.card, marginBottom: 14 }}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
												<span style={{ fontWeight: 700, fontSize: 14, color: '#00284d' }}>{hu.codigo}: {hu.titulo}</span>
												<button className="uc-btn-sm" onClick={() => setShowLinkTrazabilidad(hu.id)}>+ Vincular</button>
											</div>
											{items.length === 0 && <p style={{ fontSize: 12, color: '#7a9ab5' }}>Sin enlaces</p>}
											{items.length > 0 && (
												<div style={{ fontSize: 12 }}>
													{items.map((item) => (
														<div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid #f0f4f8' }}>
															<span style={{ fontWeight: 600, color: '#003e70', minWidth: 60 }}>{item.tipoArtefacto}</span>
															<span style={{ color: '#7a9ab5' }}>{item.repositorio}</span>
															<span style={{ color: '#4a6a85' }}>#{item.referencia}</span>
															{item.enlace && <a href={item.enlace} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', textDecoration: 'none' }}>🔗</a>}
															<span style={{ color: '#7a9ab5', marginLeft: 'auto', fontSize: 11 }}>{formatearFecha(item.extraido)}</span>
														</div>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}

						{/* ══════════ TAB: RETROSPECTIVA ══════════ */}
						{tab === 'retrospectiva' && (
							<div>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
									<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#00284d' }}>Retrospectiva</h2>
									{!retrospectiva && <button className="uc-btn-p-sm" onClick={() => {
										setRetroForm({ ...retroForm, fechaRetrospectiva: new Date().toISOString().split('T')[0] });
										setShowCrearRetro(true);
									}}>+ Crear</button>}
								</div>
								{!retrospectiva ? (
									<p style={{ color: '#7a9ab5' }}>No hay retrospectiva para este sprint.</p>
								) : (
									<div>
										<p style={{ fontSize: 13, color: '#4a6a85', marginBottom: 16 }}>📅 {formatearFecha(retrospectiva.fechaRetrospectiva)}</p>
										{retrospectiva.comentariosGenerales && (
											<div style={{ ...s.card, marginBottom: 16 }}>
												<h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#00284d' }}>Comentarios Generales</h4>
												<p style={{ margin: 0, fontSize: 13, color: '#4a6a85' }}>{retrospectiva.comentariosGenerales}</p>
											</div>
										)}
										{retrospectiva.acuerdos.length > 0 && (
											<div style={{ ...s.card, marginBottom: 16 }}>
												<h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#00284d' }}>Acuerdos ({retrospectiva.acuerdos.length})</h4>
												{retrospectiva.acuerdos.map((a) => (
													<div key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f4f8', fontSize: 13, color: '#4a6a85', display: 'flex', justifyContent: 'space-between' }}>
														<span>{a.descripcion}</span>
														{a.responsable && <span style={{ color: '#7a9ab5' }}>👤 {a.responsable}</span>}
													</div>
												))}
											</div>
										)}
										{retrospectiva.impedimentos.length > 0 && (
											<div style={{ ...s.card }}>
												<h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#00284d' }}>Impedimentos ({retrospectiva.impedimentos.length})</h4>
												{retrospectiva.impedimentos.map((imp) => {
													const impColor = imp.impacto === 'Alto' ? '#c0392b' : imp.impacto === 'Medio' ? '#f39c12' : '#27ae60';
													return (
														<div key={imp.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f4f8', fontSize: 13, color: '#4a6a85', display: 'flex', justifyContent: 'space-between' }}>
															<span><span style={{ color: impColor, fontWeight: 700 }}>●</span> {imp.descripcion}</span>
															<div style={{ display: 'flex', gap: 8 }}>
																<span style={{ color: impColor, fontWeight: 600 }}>{imp.impacto}</span>
																{imp.responsable && <span style={{ color: '#7a9ab5' }}>👤 {imp.responsable}</span>}
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								)}
							</div>
						)}

						{/* ══════════ TAB: IMPEDIMENTOS ══════════ */}
						{tab === 'impedimentos' && (
							<div>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
									<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#00284d' }}>Impedimentos</h2>
									<button className="uc-btn-p-sm" onClick={() => setShowCrearImpedimento(true)}>+ Impedimento</button>
								</div>
								{impedimentos.length === 0 ? (
									<p style={{ color: '#7a9ab5' }}>No hay impedimentos registrados.</p>
								) : (
									<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
										{impedimentos.map((imp) => {
											const stCfg = IMPEDIMENTO_ESTADO_CONFIG[imp.estado] || IMPEDIMENTO_ESTADO_CONFIG.ABIERTO;
											return (
												<div key={imp.id} style={{ ...s.card, borderLeft: `4px solid ${imp.esCritico ? '#c0392b' : stCfg.color}` }}>
													<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
														<div style={{ flex: 1 }}>
															<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
																{imp.esCritico && <span style={{ backgroundColor: '#c0392b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>CRÍTICO</span>}
																<span style={{ backgroundColor: stCfg.color + '20', color: stCfg.color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{stCfg.label}</span>
															</div>
															<p style={{ margin: '4px 0', fontSize: 14, color: '#00284d', fontWeight: 600 }}>{imp.descripcion}</p>
															<div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#7a9ab5' }}>
																<span>📅 {formatearFecha(imp.fechaApertura)}</span>
																<span>⏱ {imp.diasAbierto} días</span>
																{imp.responsable && <span>👤 {imp.responsable}</span>}
															</div>
														</div>
														<select
															className="uc-inp uc-inp-sm"
															style={{ width: 'auto', fontSize: 11, padding: '4px 8px', marginLeft: 12 }}
															value={imp.estado}
															onChange={(e) => handleCambiarEstadoImpedimento(imp.id, e.target.value as ImpedimentoEstado)}
														>
															{(Object.keys(IMPEDIMENTO_ESTADO_CONFIG) as ImpedimentoEstado[]).map((est) => (
																<option key={est} value={est}>{IMPEDIMENTO_ESTADO_CONFIG[est].label}</option>
															))}
														</select>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}

						{/* ══════════ TAB: EXPORTAR ══════════ */}
						{tab === 'exportar' && (
							<div>
								<h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#00284d' }}>Exportación</h2>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
									<div style={s.card}>
										<h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#00284d' }}>📄 Historias (CSV)</h4>
										<p style={{ fontSize: 12, color: '#7a9ab5', marginBottom: 12 }}>Descargar historias de usuario en formato CSV</p>
										<button className="uc-btn-p-sm" onClick={() => handleExportCSV('historias')}>Descargar</button>
									</div>
									<div style={s.card}>
										<h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#00284d' }}>📋 Criterios (CSV)</h4>
										<p style={{ fontSize: 12, color: '#7a9ab5', marginBottom: 12 }}>Descargar criterios de aceptación en CSV</p>
										<button className="uc-btn-p-sm" onClick={() => handleExportCSV('criterios')}>Descargar</button>
									</div>
									<div style={s.card}>
										<h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#00284d' }}>⚠️ Impedimentos (CSV)</h4>
										<p style={{ fontSize: 12, color: '#7a9ab5', marginBottom: 12 }}>Descargar impedimentos en formato CSV</p>
										<button className="uc-btn-p-sm" onClick={() => handleExportCSV('impedimentos')}>Descargar</button>
									</div>
									<div style={s.card}>
										<h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#00284d' }}>📊 Reporte (PDF)</h4>
										<p style={{ fontSize: 12, color: '#7a9ab5', marginBottom: 12 }}>Descargar reporte completo del sprint</p>
										<button className="uc-btn-p-sm" onClick={() => setShowExportPDF(true)}>Descargar</button>
									</div>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* ── MODAL: Crear HU ── */}
			{showCrearHU && (
				<div className="uc-modal-o" onClick={() => setShowCrearHU(false)}>
					<div className="uc-modal-c" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
							<h3 style={{ margin: 0, fontSize: 16, color: '#00284d' }}>📄 Nueva Historia de Usuario</h3>
							<button onClick={() => setShowCrearHU(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#7a9ab5' }}>✕</button>
						</div>
						<form onSubmit={handleCrearHU}>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Código</label>
								<input className="uc-inp" value={huForm.codigo} onChange={(e) => setHuForm({ ...huForm, codigo: e.target.value })} />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Título *</label>
								<input className="uc-inp" value={huForm.titulo} onChange={(e) => setHuForm({ ...huForm, titulo: e.target.value })} />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Descripción</label>
								<textarea className="uc-inp" style={{ minHeight: 60, resize: 'vertical' }} value={huForm.descripcion} onChange={(e) => setHuForm({ ...huForm, descripcion: e.target.value })} />
							</div>
							<div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
								<div style={{ flex: 1 }}>
									<label style={s.label}>Story Points</label>
									<input type="number" className="uc-inp" min={1} value={huForm.storyPoints} onChange={(e) => setHuForm({ ...huForm, storyPoints: parseInt(e.target.value) || 1 })} />
								</div>
								<div style={{ flex: 1 }}>
									<label style={s.label}>Prioridad</label>
									<input type="number" className="uc-inp" min={1} max={5} value={huForm.prioridad} onChange={(e) => setHuForm({ ...huForm, prioridad: parseInt(e.target.value) || 1 })} />
								</div>
							</div>
							<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
								<button type="button" className="uc-btn-s" onClick={() => setShowCrearHU(false)}>Cancelar</button>
								<button type="submit" className="uc-btn-p-sm">Crear HU</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ── MODAL: Vincular Trazabilidad ── */}
			{showLinkTrazabilidad && (
				<div className="uc-modal-o" onClick={() => setShowLinkTrazabilidad(null)}>
					<div className="uc-modal-c" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
							<h3 style={{ margin: 0, fontSize: 16, color: '#00284d' }}>🔗 Vincular Trazabilidad</h3>
							<button onClick={() => setShowLinkTrazabilidad(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#7a9ab5' }}>✕</button>
						</div>
						<form onSubmit={handleLinkTrazabilidad}>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Repositorio</label>
								<select className="uc-inp" value={trazabilidadForm.repositorio} onChange={(e) => setTrazabilidadForm({ ...trazabilidadForm, repositorio: e.target.value as 'BACKEND' | 'FRONTEND' })}>
									<option value="BACKEND">Backend</option>
									<option value="FRONTEND">Frontend</option>
								</select>
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Nombre Repositorio</label>
								<input className="uc-inp" value={trazabilidadForm.nombreRepositorio} onChange={(e) => setTrazabilidadForm({ ...trazabilidadForm, nombreRepositorio: e.target.value })} placeholder="uniconnect-backend" />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>SHA Commit</label>
								<input className="uc-inp" value={trazabilidadForm.shaCommit} onChange={(e) => setTrazabilidadForm({ ...trazabilidadForm, shaCommit: e.target.value })} placeholder="abc123def456" />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>URL Commit</label>
								<input className="uc-inp" value={trazabilidadForm.urlCommit} onChange={(e) => setTrazabilidadForm({ ...trazabilidadForm, urlCommit: e.target.value })} placeholder="https://github.com/..." />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Número PR</label>
								<input className="uc-inp" value={trazabilidadForm.numeroPR} onChange={(e) => setTrazabilidadForm({ ...trazabilidadForm, numeroPR: e.target.value })} placeholder="123" />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>URL PR</label>
								<input className="uc-inp" value={trazabilidadForm.urlPR} onChange={(e) => setTrazabilidadForm({ ...trazabilidadForm, urlPR: e.target.value })} placeholder="https://github.com/..." />
							</div>
							<div style={{ marginBottom: 16 }}>
								<label style={s.label}>Estado PR</label>
								<select className="uc-inp" value={trazabilidadForm.estadoPR} onChange={(e) => setTrazabilidadForm({ ...trazabilidadForm, estadoPR: e.target.value })}>
									<option value="OPEN">Open</option>
									<option value="MERGED">Merged</option>
									<option value="CLOSED">Closed</option>
								</select>
							</div>
							<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
								<button type="button" className="uc-btn-s" onClick={() => setShowLinkTrazabilidad(null)}>Cancelar</button>
								<button type="submit" className="uc-btn-p-sm">Vincular</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ── MODAL: Crear Retrospectiva ── */}
			{showCrearRetro && (
				<div className="uc-modal-o" onClick={() => setShowCrearRetro(false)}>
					<div className="uc-modal-c" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
							<h3 style={{ margin: 0, fontSize: 16, color: '#00284d' }}>📝 Nueva Retrospectiva</h3>
							<button onClick={() => setShowCrearRetro(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#7a9ab5' }}>✕</button>
						</div>
						<form onSubmit={handleCrearRetrospectiva}>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Fecha</label>
								<input type="date" className="uc-inp" value={retroForm.fechaRetrospectiva} onChange={(e) => setRetroForm({ ...retroForm, fechaRetrospectiva: e.target.value })} />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Comentarios Generales</label>
								<textarea className="uc-inp" style={{ minHeight: 60, resize: 'vertical' }} value={retroForm.comentariosGenerales} onChange={(e) => setRetroForm({ ...retroForm, comentariosGenerales: e.target.value })} />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Acuerdo (opcional)</label>
								<input className="uc-inp" value={retroForm.acuerdoDesc} onChange={(e) => setRetroForm({ ...retroForm, acuerdoDesc: e.target.value })} placeholder="Descripción del acuerdo" />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Responsable del acuerdo</label>
								<input className="uc-inp" value={retroForm.acuerdoResp} onChange={(e) => setRetroForm({ ...retroForm, acuerdoResp: e.target.value })} />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Impedimento (opcional)</label>
								<input className="uc-inp" value={retroForm.impedimentoDesc} onChange={(e) => setRetroForm({ ...retroForm, impedimentoDesc: e.target.value })} placeholder="Descripción del impedimento" />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Impacto</label>
								<select className="uc-inp" value={retroForm.impedimentoImpacto} onChange={(e) => setRetroForm({ ...retroForm, impedimentoImpacto: e.target.value })}>
									<option value="Alto">Alto</option>
									<option value="Medio">Medio</option>
									<option value="Bajo">Bajo</option>
								</select>
							</div>
							<div style={{ marginBottom: 16 }}>
								<label style={s.label}>Responsable del impedimento</label>
								<input className="uc-inp" value={retroForm.impedimentoResp} onChange={(e) => setRetroForm({ ...retroForm, impedimentoResp: e.target.value })} />
							</div>
							<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
								<button type="button" className="uc-btn-s" onClick={() => setShowCrearRetro(false)}>Cancelar</button>
								<button type="submit" className="uc-btn-p-sm">Crear Retrospectiva</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ── MODAL: Crear Impedimento ── */}
			{showCrearImpedimento && (
				<div className="uc-modal-o" onClick={() => setShowCrearImpedimento(false)}>
					<div className="uc-modal-c" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
							<h3 style={{ margin: 0, fontSize: 16, color: '#00284d' }}>⚠️ Nuevo Impedimento</h3>
							<button onClick={() => setShowCrearImpedimento(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#7a9ab5' }}>✕</button>
						</div>
						<form onSubmit={handleCrearImpedimento}>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Descripción *</label>
								<textarea className="uc-inp" style={{ minHeight: 60, resize: 'vertical' }} value={impForm.descripcion} onChange={(e) => setImpForm({ ...impForm, descripcion: e.target.value })} />
							</div>
							<div style={{ marginBottom: 16 }}>
								<label style={s.label}>Responsable</label>
								<input className="uc-inp" value={impForm.responsable} onChange={(e) => setImpForm({ ...impForm, responsable: e.target.value })} />
							</div>
							<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
								<button type="button" className="uc-btn-s" onClick={() => setShowCrearImpedimento(false)}>Cancelar</button>
								<button type="submit" className="uc-btn-p-sm">Registrar</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ── MODAL: Exportar PDF ── */}
			{showExportPDF && (
				<div className="uc-modal-o" onClick={() => setShowExportPDF(false)}>
					<div className="uc-modal-c" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
							<h3 style={{ margin: 0, fontSize: 16, color: '#00284d' }}>📊 Exportar Reporte PDF</h3>
							<button onClick={() => setShowExportPDF(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#7a9ab5' }}>✕</button>
						</div>
						<p style={{ fontSize: 13, color: '#4a6a85', marginBottom: 16 }}>Selecciona las secciones a incluir:</p>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
							<button className="uc-btn-p-sm" onClick={() => handleExportPDF({ trazabilidad: false, retrospectiva: false, impedimentos: false })}>Solo métricas</button>
							<button className="uc-btn-p-sm" onClick={() => handleExportPDF({ trazabilidad: true, retrospectiva: false, impedimentos: false })}>Incluir trazabilidad</button>
							<button className="uc-btn-p-sm" onClick={() => handleExportPDF({ trazabilidad: false, retrospectiva: true, impedimentos: false })}>Incluir retrospectiva</button>
							<button className="uc-btn-p-sm" onClick={() => handleExportPDF({ trazabilidad: false, retrospectiva: false, impedimentos: true })}>Incluir impedimentos</button>
							<button className="uc-btn-p-sm" style={{ background: '#00284d' }} onClick={() => handleExportPDF({ trazabilidad: true, retrospectiva: true, impedimentos: true })}>Todo incluido</button>
						</div>
						<button className="uc-btn-s" onClick={() => setShowExportPDF(false)}>Cancelar</button>
					</div>
				</div>
			)}

			{/* ── MODAL: Criterios de Aceptación ── */}
			{showCriterios && (
				<div className="uc-modal-o" onClick={() => setShowCriterios(null)}>
					<div className="uc-modal-c" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
							<h3 style={{ margin: 0, fontSize: 16, color: '#00284d' }}>✓ Criterios — {showCriterios.codigo}</h3>
							<button onClick={() => setShowCriterios(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#7a9ab5' }}>✕</button>
						</div>
						<p style={{ fontSize: 14, fontWeight: 600, color: '#00284d', marginBottom: 12 }}>{showCriterios.titulo}</p>
						{(criteriosMap[showCriterios.id] || []).length === 0 && <p style={{ color: '#7a9ab5', fontSize: 13 }}>Sin criterios definidos</p>}
						{(criteriosMap[showCriterios.id] || []).map((c) => (
							<div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f4f8' }}>
								<button
									onClick={() => handleEvaluarCriterio(c.id, !c.cumplido)}
									style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${c.cumplido ? '#27ae60' : '#c5d3df'}`, background: c.cumplido ? '#27ae60' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, padding: 0, flexShrink: 0 }}
								>
									{c.cumplido ? '✓' : ''}
								</button>
								<span style={{ fontSize: 13, color: '#4a6a85' }}>{c.numero}. {c.descripcion}</span>
							</div>
						))}
						<div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
							<input className="uc-inp" placeholder="Nuevo criterio..." value={criterioForm.descripcion} onChange={(e) => setCriterioForm({ descripcion: e.target.value })} />
							<button className="uc-btn-p-sm" onClick={() => handleCrearCriterio(showCriterios.id)} disabled={!criterioForm.descripcion.trim()}>Agregar</button>
						</div>
						{cumplimientoMap[showCriterios.id] && (
							<div style={{ marginTop: 14, fontSize: 13, color: '#4a6a85', textAlign: 'center' }}>
								{cumplimientoMap[showCriterios.id].cumplidos} de {cumplimientoMap[showCriterios.id].total} criterios cumplidos ({cumplimientoMap[showCriterios.id].porcentaje}%)
							</div>
						)}
					</div>
				</div>
			)}

			{/* ── MODAL: Editar HU ── */}
			{showEditHU && (
				<div className="uc-modal-o" onClick={() => setShowEditHU(null)}>
					<div className="uc-modal-c" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
							<h3 style={{ margin: 0, fontSize: 16, color: '#00284d' }}>✎ Editar {showEditHU.codigo}</h3>
							<button onClick={() => setShowEditHU(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#7a9ab5' }}>✕</button>
						</div>
						<form onSubmit={async (e) => {
							e.preventDefault();
							if (!showEditHU) return;
							try {
								await historiaUsuarioService.actualizar(showEditHU.id, {
									titulo: showEditHU.titulo,
									descripcion: showEditHU.descripcion,
									storyPoints: showEditHU.storyPoints,
									prioridad: showEditHU.prioridad,
								});
								showMsg('HU actualizada');
								setShowEditHU(null);
								await cargarTodo();
							} catch (err: any) { showMsg(err.message, 'error'); }
						}}>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Título</label>
								<input className="uc-inp" value={showEditHU.titulo} onChange={(e) => setShowEditHU({ ...showEditHU, titulo: e.target.value })} />
							</div>
							<div style={{ marginBottom: 12 }}>
								<label style={s.label}>Descripción</label>
								<textarea className="uc-inp" style={{ minHeight: 60, resize: 'vertical' }} value={showEditHU.descripcion} onChange={(e) => setShowEditHU({ ...showEditHU, descripcion: e.target.value })} />
							</div>
							<div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
								<div style={{ flex: 1 }}>
									<label style={s.label}>Story Points</label>
									<input type="number" className="uc-inp" min={1} value={showEditHU.storyPoints} onChange={(e) => setShowEditHU({ ...showEditHU, storyPoints: parseInt(e.target.value) || 1 })} />
								</div>
								<div style={{ flex: 1 }}>
									<label style={s.label}>Prioridad</label>
									<input type="number" className="uc-inp" min={1} max={5} value={showEditHU.prioridad} onChange={(e) => setShowEditHU({ ...showEditHU, prioridad: parseInt(e.target.value) || 1 })} />
								</div>
							</div>
							<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
								<button type="button" className="uc-btn-s" onClick={() => setShowEditHU(null)}>Cancelar</button>
								<button type="submit" className="uc-btn-p-sm">Guardar</button>
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
	content: { maxWidth: 1100, margin: '0 auto', padding: '24px 20px 48px' },
	sprintHeader: { backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e8eef4', padding: '18px 22px', marginBottom: 20 },
	centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0' },
	spinner: { width: 36, height: 36, border: '3px solid #dce6ef', borderTopColor: theme.colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
	errorBox: { backgroundColor: '#fdf0f0', border: '1px solid #f5c6cb', borderRadius: 10, padding: '14px 18px', color: '#c0392b', fontSize: 14 },
	metricCard: { backgroundColor: '#fff', border: '1px solid #e8eef4', borderRadius: 12, padding: '16px 18px' },
	section: { backgroundColor: '#fff', border: '1px solid #e8eef4', borderRadius: 14, padding: '18px 20px', marginBottom: 20 },
	sectionTitle: { margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#00284d' },
	card: { backgroundColor: '#fff', border: '1px solid #e8eef4', borderRadius: 12, padding: '14px 16px' },
	label: { display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#4a6a85' },
};
