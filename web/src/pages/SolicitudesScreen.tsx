import { useState, useEffect, useCallback } from 'react';

import { usuariosService } from '../services/usuarios.service';
import { clearUnreadContactRequestNotification } from '../services/notificaciones-solicitudes.service';
import type { SolicitudPendiente } from '../types/api.types';

export default function SolicitudesScreen() {
	const [solicitudes, setSolicitudes] = useState<SolicitudPendiente[]>([]);
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
			const data = await usuariosService.getSolicitudesRecibidas();
			setSolicitudes(data);
		} catch {
			showMsg('No se pudieron cargar las solicitudes', 'error');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  cargarSolicitudes();
}, [cargarSolicitudes]);

	const procesarSolicitud = async (solicitud: SolicitudPendiente, action: 'aceptar' | 'rechazar') => {
		setProcessingId(solicitud.solicitudId);
		try {
			if (action === 'aceptar') await usuariosService.aceptarSolicitud(solicitud.solicitudId);
			else await usuariosService.rechazarSolicitud(solicitud.solicitudId);
			
			await clearUnreadContactRequestNotification(solicitud.solicitudId);
			setSolicitudes(prev => prev.filter(item => item.solicitudId !== solicitud.solicitudId));
			showMsg(`Solicitud ${action === 'aceptar' ? 'aceptada' : 'rechazada'}`);
		} catch {
			showMsg('No fue posible procesar la solicitud', 'error');
		} finally {
			setProcessingId(null);
		}
	};

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				.uc-sol-card { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-radius: 12px; background: #fff; border: 1px solid #e8eef4; transition: box-shadow 0.15s; margin-bottom: 12px; }
				.uc-sol-card:hover { box-shadow: 0 4px 12px rgba(0,62,112,0.08); }
				.uc-btn-sm { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: opacity 0.15s; }
				.uc-btn-sm.accept { background: #27ae60; color: #fff; }
				.uc-btn-sm.reject { background: #e74c3c; color: #fff; }
				.uc-btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
				@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
			`}</style>

			{toast && (
				<div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, backgroundColor: toast.type === 'error' ? '#c0392b' : '#27ae60', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
					{toast.msg}
				</div>
			)}

			<div style={s.content}>
				<h1 style={s.pageTitle}>Solicitudes</h1>
				<p style={s.pageSubtitle}>Revisa las solicitudes de contacto y decide si aceptas o rechazas.</p>

				{loading ? (
					<p style={{ color: '#7a9ab5', fontSize: 15, textAlign: 'center', padding: '40px 0' }}>Cargando solicitudes...</p>
				) : solicitudes.length === 0 ? (
					<div style={s.emptyState}>
						<span style={{ fontSize: 44 }}>📭</span>
						<p style={{ fontSize: 16, fontWeight: 600, color: '#00284d', margin: '12px 0 4px' }}>No tienes solicitudes pendientes</p>
						<p style={{ color: '#7a9ab5', fontSize: 14 }}>Cuando recibas una solicitud, aparecerá aquí.</p>
					</div>
				) : (
					<div style={{ animation: 'fadeUp 0.3s ease' }}>
						{solicitudes.map(sol => {
							const proc = processingId === sol.solicitudId;
							return (
								<div key={sol.solicitudId} className="uc-sol-card">
									<div>
										<p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#00284d' }}>{sol.nombre}</p>
										<p style={{ margin: '2px 0 0', fontSize: 14, color: '#7a9ab5' }}>{sol.correo}</p>
									</div>
									<div style={{ display: 'flex', gap: 10 }}>
										<button className="uc-btn-sm accept" onClick={() => procesarSolicitud(sol, 'aceptar')} disabled={proc}>Aceptar</button>
										<button className="uc-btn-sm reject" onClick={() => procesarSolicitud(sol, 'rechazar')} disabled={proc}>Rechazar</button>
									</div>
								</div>
							);
						})}
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