import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuariosService } from '../services/usuarios.service';
import { authService } from '../services/auth.service';
import { clearUnreadContactRequestNotification } from '../services/notificaciones-solicitudes.service';
import type { Usuario } from '../types/api.types';

type Contacto = { id: string; nombre: string; apellido?: string; correo: string };
type Solicitud = { solicitudId: string; solicitanteId: string; nombre: string; correo: string };

const CSS = `
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
	* { box-sizing: border-box; }
	.uc-search-input { width: 100%; padding: 11px 40px 11px 42px; border: 1.5px solid #c5d3df; border-radius: 10px; font-size: 14px; font-family: 'Inter', sans-serif; color: #00284d; outline: none; transition: border-color 0.2s; background: #fff; }
	.uc-search-input:focus { border-color: #003e70; box-shadow: 0 0 0 3px rgba(0,62,112,0.08); }
	.uc-contact-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px; background: #fff; border: 1px solid #e8eef4; transition: box-shadow 0.15s; }
	.uc-contact-card:hover { box-shadow: 0 4px 12px rgba(0,62,112,0.08); }
	.uc-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #003e70, #007ad4); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 700; flex-shrink: 0; }
	.uc-btn-sm { padding: 7px 13px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: all 0.15s; white-space: nowrap; }
	.uc-btn-sm.primary { background: #003e70; color: #fff; }
	.uc-btn-sm.primary:hover:not(:disabled) { background: #00284d; }
	.uc-btn-sm.success { background: #27ae60; color: #fff; }
	.uc-btn-sm.danger { background: #e74c3c; color: #fff; }
	.uc-btn-sm.outline { background: transparent; color: #4a6a85; border: 1.5px solid #c5d3df; }
	.uc-btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
	@keyframes spin { to { transform: rotate(360deg); } }
	@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function ContactScreen() {
	const navigate = useNavigate();
	const [contactos, setContactos] = useState<Contacto[]>([]);
	const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Usuario[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [sendingTo, setSendingTo] = useState<string | null>(null);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [contactosIds, setContactosIds] = useState<Set<string>>(new Set());
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
	const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	const cargarDatos = async () => {
		setLoading(true); setError(null);
		try {
			const [uid, companeros, solicitudesRes] = await Promise.allSettled([
				authService.obtenerIdUsuarioActual(),
				usuariosService.getCompaneros(),
				usuariosService.getSolicitudesRecibidas(),
			]);
			if (uid.status === 'fulfilled') setCurrentUserId(uid.value);
			if (companeros.status === 'fulfilled') {
				setContactos(companeros.value);
				setContactosIds(new Set(companeros.value.map((c) => c.id)));
			}
			if (solicitudesRes.status === 'fulfilled') setSolicitudes(solicitudesRes.value);
		} catch (e: any) {
			setError(e.message || 'Error al cargar contactos');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { cargarDatos(); }, []);

	// Search con debounce
	useEffect(() => {
		if (searchRef.current) clearTimeout(searchRef.current);
		if (!searchQuery.trim()) { setSearchResults([]); return; }
		searchRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				let res = await usuariosService.buscarUsuarios(searchQuery);
				res = res.filter((u) => u.id !== currentUserId);
				setSearchResults(res);
			} catch { setSearchResults([]); showMsg('Error al buscar usuarios', 'error'); }
			finally { setIsSearching(false); }
		}, 350);
		return () => { if (searchRef.current) clearTimeout(searchRef.current); };
	}, [searchQuery, currentUserId]);

	const procesarSolicitud = async (solicitudId: string, action: 'aceptar' | 'rechazar') => {
		setProcessingId(solicitudId);
		try {
			if (action === 'aceptar') await usuariosService.aceptarSolicitud(solicitudId);
			else await usuariosService.rechazarSolicitud(solicitudId);
			await clearUnreadContactRequestNotification(solicitudId);
			setSolicitudes((prev) => prev.filter((s) => s.solicitudId !== solicitudId));
			if (action === 'aceptar') await cargarDatos();
			showMsg(action === 'aceptar' ? 'Solicitud aceptada' : 'Solicitud rechazada');
		} catch { showMsg('No fue posible procesar la solicitud', 'error'); }
		finally { setProcessingId(null); }
	};

	const handleEnviarSolicitud = async (usuarioId: string) => {
		setSendingTo(usuarioId);
		try {
			await usuariosService.enviarSolicitud(usuarioId);
			showMsg('Solicitud enviada correctamente');
			setSearchQuery(''); setSearchResults([]);
		} catch (e: any) { showMsg(e.message || 'No fue posible enviar la solicitud', 'error'); }
		finally { setSendingTo(null); }
	};

	const getInitials = (nombre: string, apellido?: string) =>
		[nombre[0], apellido?.[0]].filter(Boolean).join('').toUpperCase();

	return (
		<div style={s.page}>
			<style>{CSS}</style>

			{toast && (
				<div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, backgroundColor: toast.type === 'error' ? '#c0392b' : '#27ae60', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
					{toast.msg}
				</div>
			)}

			<div style={s.content}>
				<h1 style={s.pageTitle}>Contactos</h1>
				<p style={s.pageSubtitle}>Aquí podrás ver y gestionar tus contactos de UniConnect.</p>

				{/* Barra de búsqueda */}
				<div style={{ position: 'relative', marginBottom: 28 }}>
					<span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#7a9ab5', pointerEvents: 'none' }}>🔍</span>
					<input
						className="uc-search-input"
						placeholder="Buscar compañeros..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button
							onClick={() => { setSearchQuery(''); setSearchResults([]); }}
							style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#7a9ab5' }}
						>✕</button>
					)}
				</div>

				{/* Resultados de búsqueda */}
				{searchQuery && (
					<div style={{ marginBottom: 28, animation: 'fadeUp 0.2s ease' }}>
						<p style={s.sectionLabel}>Resultados de búsqueda</p>
						{isSearching ? (
							<p style={{ color: '#7a9ab5', fontSize: 14 }}>Buscando...</p>
						) : searchResults.length === 0 ? (
							<p style={{ color: '#7a9ab5', fontSize: 14 }}>No se encontraron compañeros.</p>
						) : (
							<div style={s.list}>
								{searchResults.map((u) => {
									const esContacto = contactosIds.has(u.id);
									return (
										<div key={u.id} className="uc-contact-card">
											<div className="uc-avatar">{getInitials(u.nombre, u.apellido)}</div>
											<div style={{ flex: 1, minWidth: 0 }}>
												<p style={s.contactName}>{u.nombre} {u.apellido}</p>
												<p style={s.contactEmail}>{u.correo}</p>
											</div>
											<div style={{ display: 'flex', gap: 8 }}>
												<button className="uc-btn-sm outline" onClick={() => navigate(`/mensajes/directo/${u.id}`)}>💬 Mensaje</button>
												{!esContacto && (
													<button className="uc-btn-sm primary" onClick={() => handleEnviarSolicitud(u.id)} disabled={sendingTo === u.id}>
														{sendingTo === u.id ? '...' : '+ Agregar'}
													</button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}

				{/* Solicitudes pendientes */}
				{!searchQuery && (
					<>
						<div style={{ marginBottom: 28 }}>
							<p style={s.sectionLabel}>
								Solicitudes pendientes
								{solicitudes.length > 0 && (
									<span style={{ marginLeft: 8, backgroundColor: '#e74c3c', color: '#fff', fontSize: 11, padding: '2px 7px', borderRadius: 12, fontWeight: 700 }}>
										{solicitudes.length}
									</span>
								)}
							</p>
							{loading ? (
								<p style={{ color: '#7a9ab5', fontSize: 14 }}>Cargando...</p>
							) : solicitudes.length === 0 ? (
								<div style={s.emptyMini}>📭 No tienes solicitudes pendientes</div>
							) : (
								<div style={s.list}>
									{solicitudes.map((sol) => {
										const proc = processingId === sol.solicitudId;
										return (
											<div key={sol.solicitudId} className="uc-contact-card">
												<div className="uc-avatar">{sol.nombre?.[0]?.toUpperCase() ?? '?'}</div>
												<div style={{ flex: 1, minWidth: 0 }}>
													<p style={s.contactName}>{sol.nombre}</p>
													<p style={s.contactEmail}>{sol.correo}</p>
												</div>
												<div style={{ display: 'flex', gap: 8 }}>
													<button className="uc-btn-sm success" onClick={() => procesarSolicitud(sol.solicitudId, 'aceptar')} disabled={proc}>{proc ? '...' : 'Aceptar'}</button>
													<button className="uc-btn-sm danger" onClick={() => procesarSolicitud(sol.solicitudId, 'rechazar')} disabled={proc}>Rechazar</button>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>

						{/* Lista de contactos */}
						<div>
							<p style={s.sectionLabel}>Mis contactos ({contactos.length})</p>
							{loading ? (
								<p style={{ color: '#7a9ab5', fontSize: 14 }}>Cargando contactos...</p>
							) : error ? (
								<div style={{ color: '#c0392b', fontSize: 14 }}>⚠️ {error}</div>
							) : contactos.length === 0 ? (
								<div style={s.emptyState}>
									<span style={{ fontSize: 44 }}>💬</span>
									<p style={{ fontSize: 15, color: '#7a9ab5', margin: '12px 0 0' }}>Aún no tienes contactos agregados.</p>
								</div>
							) : (
								<div style={s.list}>
									{contactos.map((c) => (
										<div key={c.id} className="uc-contact-card">
											<div className="uc-avatar">{getInitials(c.nombre, c.apellido)}</div>
											<div style={{ flex: 1, minWidth: 0 }}>
												<p style={s.contactName}>{c.nombre} {c.apellido ?? ''}</p>
												<p style={s.contactEmail}>{c.correo}</p>
											</div>
											<button className="uc-btn-sm primary" onClick={() => navigate(`/mensajes/directo/${c.id}`)}>
												💬 Mensaje
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	page: { minHeight: '100%', backgroundColor: '#f0f4f8', fontFamily: "'Inter', sans-serif" },
	content: { maxWidth: 700, margin: '0 auto', padding: '32px 20px 48px' },
	pageTitle: { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#00284d' },
	pageSubtitle: { margin: '0 0 24px', fontSize: 14, color: '#7a9ab5' },
	sectionLabel: { margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#003e70', textTransform: 'uppercase', letterSpacing: 0.5 },
	list: { display: 'flex', flexDirection: 'column', gap: 10 },
	contactName: { margin: 0, fontSize: 15, fontWeight: 600, color: '#00284d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
	contactEmail: { margin: '2px 0 0', fontSize: 13, color: '#7a9ab5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
	emptyMini: { padding: '12px 16px', backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e8eef4', fontSize: 14, color: '#7a9ab5' },
	emptyState: { textAlign: 'center', padding: '48px 0' },
};