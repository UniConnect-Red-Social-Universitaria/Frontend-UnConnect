import { useState, useEffect, useCallback } from 'react';
import { gruposService } from '../services/grupos.service';
import { authService } from '../services/auth.service';
import type { SolicitudGrupo } from '../types/api.types';

type GrupoConSolicitudes = {
	grupoId: string;
	grupoNombre: string;
	materiaNombre: string;
	solicitudes: SolicitudGrupo[];
};

export default function SolicitudesGrupoScreen() {
	const [grupos, setGrupos] = useState<GrupoConSolicitudes[]>([]);
	const [loading, setLoading] = useState(true);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	const cargarSolicitudes = useCallback(async () => {
		setLoading(true);
		try {
			const misGrupos = await gruposService.getGrupos();
			const userId = await authService.obtenerIdUsuarioActual();
			const gruposAdmin = (misGrupos as any[]).filter(
				(g) => g.creadorId === userId || g.administradorId === userId
			);

			const resultados: GrupoConSolicitudes[] = [];
			for (const grupo of gruposAdmin) {
				try {
					const solicitudes = await gruposService.getSolicitudesGrupo(grupo.id);
					if (solicitudes.length > 0) {
						resultados.push({
							grupoId: grupo.id,
							grupoNombre: grupo.nombre,
							materiaNombre: grupo.materia?.nombre || '',
							solicitudes,
						});
					}
				} catch {}
			}
			setGrupos(resultados);
		} catch {
			showMsg('Error al cargar solicitudes', 'error');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { cargarSolicitudes(); }, [cargarSolicitudes]);

	const handleAprobar = async (grupoId: string, solId: string) => {
		setProcessingId(solId);
		try {
			await gruposService.aprobarSolicitud(grupoId, solId);
			showMsg('Solicitud aprobada. Estudiante agregado al grupo.');
			await cargarSolicitudes();
		} catch (err: any) {
			showMsg(err.message || 'Error al aprobar', 'error');
		} finally {
			setProcessingId(null);
		}
	};

	const handleRechazar = async (grupoId: string, solId: string) => {
		setProcessingId(solId);
		try {
			await gruposService.rechazarSolicitud(grupoId, solId);
			showMsg('Solicitud rechazada.');
			await cargarSolicitudes();
		} catch (err: any) {
			showMsg(err.message || 'Error al rechazar', 'error');
		} finally {
			setProcessingId(null);
		}
	};

	const totalSolicitudes = grupos.reduce((acc, g) => acc + g.solicitudes.length, 0);

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				.uc-sol-group { background: #fff; border: 1px solid #e8eef4; border-radius: 14px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,62,112,0.04); }
				.uc-sol-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; margin-top: 12px; }
				.uc-btn-sm { padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: opacity 0.15s; }
				.uc-btn-sm.accept { background: #003e70; color: #fff; }
				.uc-btn-sm.reject { background: transparent; color: #e74c3c; border: 1.5px solid #f5c6cb; }
				.uc-btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
				@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
			`}</style>

			{toast && (
				<div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, backgroundColor: toast.type === 'error' ? '#c0392b' : '#27ae60', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
					{toast.msg}
				</div>
			)}

			<div style={s.content}>
				<h1 style={s.pageTitle}>Solicitudes de Grupo</h1>
				<p style={s.pageSubtitle}>
					{totalSolicitudes > 0
						? `Tienes ${totalSolicitudes} solicitud${totalSolicitudes > 1 ? 'es' : ''} pendiente${totalSolicitudes > 1 ? 's' : ''} de ingreso.`
						: 'Revisa las solicitudes de ingreso a tus grupos.'}
				</p>

				{loading ? (
					<p style={{ color: '#7a9ab5', fontSize: 15, textAlign: 'center', padding: '40px 0' }}>Cargando solicitudes...</p>
				) : grupos.length === 0 ? (
					<div style={s.emptyState}>
						<span style={{ fontSize: 44 }}>👥</span>
						<p style={{ fontSize: 16, fontWeight: 600, color: '#00284d', margin: '12px 0 4px' }}>Sin solicitudes pendientes</p>
						<p style={{ color: '#7a9ab5', fontSize: 14 }}>Cuando un estudiante solicite unirse a tus grupos, aparecerá aquí.</p>
					</div>
				) : (
					<div style={{ animation: 'fadeUp 0.3s ease' }}>
						{grupos.map(g => (
							<div key={g.grupoId} className="uc-sol-group">
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eef2f6', paddingBottom: 12 }}>
									<div>
										<h3 style={{ margin: 0, fontSize: 16, color: '#00284d', fontWeight: 700 }}>{g.grupoNombre}</h3>
										<p style={{ margin: '2px 0 0', fontSize: 13, color: '#7a9ab5' }}>{g.materiaNombre}</p>
									</div>
									<span style={{ background: '#eafaf1', color: '#1e8449', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
										{g.solicitudes.length} pendientes
									</span>
								</div>
								
								{g.solicitudes.map(sol => {
									const nombreCompleto = [sol.solicitante?.nombre, sol.solicitante?.apellido].filter(Boolean).join(' ');
									const proc = processingId === sol.id;
									return (
										<div key={sol.id} className="uc-sol-card">
											<div>
												<p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#00284d' }}>{nombreCompleto || 'Estudiante'}</p>
												{sol.solicitante?.correo && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#7a9ab5' }}>{sol.solicitante.correo}</p>}
												<p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
													{new Date(sol.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
												</p>
											</div>
											<div style={{ display: 'flex', gap: 10 }}>
												<button className="uc-btn-sm accept" onClick={() => handleAprobar(g.grupoId, sol.id)} disabled={proc}>Aprobar</button>
												<button className="uc-btn-sm reject" onClick={() => handleRechazar(g.grupoId, sol.id)} disabled={proc}>Rechazar</button>
											</div>
										</div>
									);
								})}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	page: { minHeight: '100%', backgroundColor: '#f0f4f8', fontFamily: "'Inter', sans-serif" },
	content: { maxWidth: 640, margin: '0 auto', padding: '32px 20px 48px' },
	pageTitle: { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#00284d' },
	pageSubtitle: { margin: '0 0 28px', fontSize: 15, color: '#7a9ab5' },
	emptyState: { textAlign: 'center', padding: '64px 0', backgroundColor: '#fff', borderRadius: 14, border: '1px dashed #c5d3df' },
};