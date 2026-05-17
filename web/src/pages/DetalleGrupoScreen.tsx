import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gruposService } from '../services/grupos.service';
import { authService } from '../services/auth.service';
import { archivosService } from '../services/archivos.service';
import { usuariosService } from '../services/usuarios.service';
import type { Grupo, Usuario } from '../types/api.types';
import RecursosTab from '../components/RecursosTab';

export default function DetalleGrupoScreen() {
	const { grupoId } = useParams<{ grupoId: string }>();
	const navigate = useNavigate();

	const [grupo, setGrupo] = useState<Grupo | null>(null);
	const [archivos, setArchivos] = useState<any[]>([]);
	const [busqueda, setBusqueda] = useState('');
	const [userId, setUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// Estados de acciones
	const [uploading, setUploading] = useState(false);
	const [downloadingId, setDownloadingId] = useState<string | null>(null);
	const [abandonando, setAbandonando] = useState(false);

	// Estados de Modales
	const [showAddModal, setShowAddModal] = useState(false);
	const [candidatos, setCandidatos] = useState<Usuario[]>([]);
	const [agregandoId, setAgregandoId] = useState<string | null>(null);

	const [showTransferModal, setShowTransferModal] = useState(false);
	const [transferindoId, setTransferindoId] = useState<string | null>(null);
	const [confirmAction, setConfirmAction] = useState<
		| { kind: 'abandonar' }
		| { kind: 'transferir'; miembroId: string }
		| { kind: 'transferir-por-error' }
		| null
	>(null);

	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(
		null
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	useEffect(() => {
		if (!grupoId) return;
		const init = async () => {
			setLoading(true);
			try {
				const [g, a, uid] = await Promise.all([
					gruposService.getGrupo(grupoId),
					archivosService.getArchivosPorGrupo(grupoId),
					authService.obtenerIdUsuarioActual(),
				]);
				setGrupo(g);
				setArchivos(a as any[]);
				setUserId(uid);
			} catch (err: any) {
				showMsg('Error al cargar grupo', 'error');
			} finally {
				setLoading(false);
			}
		};
		init();
	}, [grupoId]);

	const isAdmin = grupo?.administradorId === userId;

	// Subir archivo
	const handleSubirPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !grupoId) return;

		if (file.size > 10 * 1024 * 1024) {
			showMsg('El archivo excede 10MB', 'error');
			return;
		}

		setUploading(true);
		try {
			await archivosService.subirArchivo(grupoId, file);
			showMsg('PDF subido correctamente');
			const a = await archivosService.getArchivosPorGrupo(grupoId);
			setArchivos(a as any[]);
		} catch (error: any) {
			showMsg(error.message || 'Error al subir', 'error');
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	// Descargar archivo
	const handleDescargar = async (archivoId: string, nombre: string) => {
		if (!grupoId) return;
		setDownloadingId(archivoId);
		try {
			const { url, headers } = await archivosService.getDownloadRequest(
				grupoId,
				archivoId
			);
			const response = await fetch(url, { headers });
			if (!response.ok) throw new Error('Error al descargar');

			const blob = await response.blob();
			const objectUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = objectUrl;
			link.download = nombre;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
		} catch {
			showMsg('Error al descargar el archivo', 'error');
		} finally {
			setDownloadingId(null);
		}
	};

	// Abandonar grupo
	const handleAbandonar = async () => {
		if (!grupoId) return;
		setConfirmAction({ kind: 'abandonar' });
	};

	const confirmarAbandono = async () => {
		if (!grupoId) return;
		setConfirmAction(null);
		setAbandonando(true);
		try {
			await gruposService.abandonarGrupo(grupoId);
			showMsg('Has abandonado el grupo');
			navigate('/grupos');
		} catch (error: any) {
			if (error.message?.includes('transferir')) {
				setConfirmAction({ kind: 'transferir-por-error' });
			} else {
				showMsg(error.message || 'Error al abandonar', 'error');
			}
		} finally {
			setAbandonando(false);
		}
	};

	// Modales (Admin)
	const cargarCandidatos = async () => {
		if (!grupo?.materia?.nombre) return;
		try {
			const usuariosDeMateria = await usuariosService.buscarPorMateria(
				grupo.materia.nombre
			);
			const miembrosIds = (grupo.miembros || []).map((m) => m.id);
			setCandidatos(usuariosDeMateria.filter((u: any) => !miembrosIds.includes(u.id)));
		} catch {
			showMsg('No se pudieron cargar candidatos', 'error');
		}
	};

	const handleAddMiembro = async (id: string) => {
		if (!grupoId) return;
		setAgregandoId(id);
		try {
			await gruposService.agregarMiembro(grupoId, id);
			showMsg('Miembro agregado');
			setShowAddModal(false);
			const g = await gruposService.getGrupo(grupoId);
			setGrupo(g);
		} catch {
			showMsg('Error al agregar miembro', 'error');
		} finally {
			setAgregandoId(null);
		}
	};

	const handleTransferAdmin = async (id: string) => {
		if (!grupoId) return;
		setConfirmAction({ kind: 'transferir', miembroId: id });
	};

	const confirmarTransferencia = async () => {
		if (!grupoId || !confirmAction || confirmAction.kind !== 'transferir') return;
		const { miembroId } = confirmAction;
		setConfirmAction(null);
		setTransferindoId(miembroId);
		try {
			await gruposService.cederAdministracion(grupoId, miembroId);
			showMsg('Administración transferida');
			setShowTransferModal(false);
			const g = await gruposService.getGrupo(grupoId);
			setGrupo(g);
		} catch {
			showMsg('Error al transferir', 'error');
		} finally {
			setTransferindoId(null);
		}
	};

	if (!grupoId) return null;

	const archivosFiltrados = archivos.filter((a) =>
		a.nombre.toLowerCase().includes(busqueda.toLowerCase())
	);

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				.uc-btn { padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: all 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
				.uc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
				.uc-btn.primary { background: #003e70; color: #fff; }
				.uc-btn.primary:hover:not(:disabled) { background: #00284d; }
				.uc-btn.success { background: #27ae60; color: #fff; }
				.uc-btn.warning { background: #d97706; color: #fff; }
				.uc-btn.danger { background: #e74c3c; color: #fff; }
				.uc-btn.outline { background: transparent; color: #003e70; border: 1.5px solid #003e70; }
				.uc-file-card { background: #fff; border: 1px solid #e8eef4; border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; transition: box-shadow 0.15s; }
				.uc-file-card:hover { box-shadow: 0 4px 12px rgba(0,62,112,0.06); }
				.uc-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
				.uc-modal { background: #fff; border-radius: 16px; padding: 24px; max-width: 480px; width: 100%; max-height: 85vh; overflow-y: auto; }
				.uc-input { width: 100%; padding: 11px 14px; border: 1.5px solid #c5d3df; border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; }
				.uc-input:focus { border-color: #003e70; }
				.uc-list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f1f5f9; }
				@keyframes spin { to { transform: rotate(360deg); } }
				@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
			`}</style>

			{toast && (
				<div
					style={{
						position: 'fixed',
						bottom: 24,
						right: 24,
						zIndex: 9999,
						backgroundColor: toast.type === 'error' ? '#c0392b' : '#27ae60',
						color: '#fff',
						padding: '12px 20px',
						borderRadius: 10,
						fontSize: 14,
						fontWeight: 500,
						boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
					}}
				>
					{toast.msg}
				</div>
			)}

			<div style={s.content}>
				{loading ? (
					<p style={{ textAlign: 'center', marginTop: 60, color: '#7a9ab5' }}>
						Cargando grupo...
					</p>
				) : !grupo ? (
					<p style={{ textAlign: 'center', marginTop: 60, color: '#c0392b' }}>
						No se pudo cargar el grupo.
					</p>
				) : (
					<div style={{ animation: 'fadeUp 0.3s ease' }}>
						<div style={s.header}>
							<h1 style={s.title}>{grupo.nombre}</h1>
							<p style={s.subtitle}>
								Espacio de trabajo del grupo • {grupo.materia?.nombre}
							</p>
						</div>

						<div style={s.actionsBar}>
							<button
								className="uc-btn primary"
								onClick={() =>
									navigate(`/mensajes/grupo/${grupo.id}`, {
										state: { nombreGrupo: grupo.nombre },
									})
								}
							>
								💬 Ir al Chat
							</button>
							{grupo.materia?.id && (
								<button
									className="uc-btn primary"
									onClick={() =>
										navigate(`/foro/${grupo.materia!.id}?nombre=${encodeURIComponent(grupo.materia!.nombre)}`)
									}
								>
									🗣️ Ir al Foro
								</button>
							)}
							<button
								className="uc-btn primary"
								onClick={() => fileInputRef.current?.click()}
								disabled={uploading}
							>
								{uploading ? 'Subiendo...' : '📄 Subir PDF'}
							</button>
							<input
								type="file"
								ref={fileInputRef}
								style={{ display: 'none' }}
								accept=".pdf,application/pdf"
								onChange={handleSubirPdf}
							/>

							{isAdmin && (
								<>
									<button
										className="uc-btn success"
										onClick={() => {
											setShowAddModal(true);
											cargarCandidatos();
										}}
									>
										+ Miembro
									</button>
									<button
										className="uc-btn warning"
										onClick={() => setShowTransferModal(true)}
									>
										Transferir
									</button>
								</>
							)}
							{userId && (
								<button
									className="uc-btn danger"
									onClick={handleAbandonar}
									disabled={abandonando}
									style={{ marginLeft: 'auto' }}
								>
									{abandonando ? 'Saliendo...' : 'Salir del Grupo'}
								</button>
							)}
						</div>

						<div style={{ marginTop: 32 }}>
							<h3 style={{ margin: '0 0 16px', color: '#00284d', fontSize: 18 }}>
								Biblioteca de Recursos</h3></div><div style={{marginTop: 32}}><RecursosTab grupoId={grupoId!} /></div><div style={{marginTop: 32}}><h3 style={{ margin: '0 0 16px', color: '#00284d', fontSize: 18 }}>Archivos del grupo
							</h3>
							<input
								className="uc-input"
								placeholder="Buscar archivo por nombre..."
								value={busqueda}
								onChange={(e) => setBusqueda(e.target.value)}
								style={{ marginBottom: 16 }}
							/>

							{archivosFiltrados.length === 0 ? (
								<p
									style={{
										color: '#7a9ab5',
										padding: '24px 0',
										textAlign: 'center',
										background: '#fff',
										borderRadius: 12,
										border: '1px dashed #c5d3df',
									}}
								>
									{busqueda
										? 'No se encontraron archivos.'
										: 'Aún no hay archivos en este grupo.'}
								</p>
							) : (
								archivosFiltrados.map((a) => (
									<div key={a.id} className="uc-file-card">
										<div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
											<p
												style={{
													margin: 0,
													fontSize: 15,
													fontWeight: 600,
													color: '#00284d',
													textOverflow: 'ellipsis',
													overflow: 'hidden',
													whiteSpace: 'nowrap',
												}}
											>
												{a.nombre}
											</p>
											<p style={{ margin: '4px 0 0', fontSize: 13, color: '#7a9ab5' }}>
												{(a.tamanoBytes / (1024 * 1024)).toFixed(2)} MB • Subido por{' '}
												{a.subidoPor?.nombre || 'Usuario'}
											</p>
										</div>
										<button
											className="uc-btn outline"
											style={{ padding: '6px 14px', fontSize: 13 }}
											onClick={() => handleDescargar(a.id, a.nombre)}
											disabled={downloadingId === a.id}
										>
											{downloadingId === a.id ? '...' : 'Descargar'}
										</button>
									</div>
								))
							)}
						</div>
					</div>
				)}
			</div>

			{/* Modal Agregar Miembro */}
			{showAddModal && (
				<div className="uc-modal-overlay" onClick={() => setShowAddModal(false)}>
					<div className="uc-modal" onClick={(e) => e.stopPropagation()}>
						<h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#00284d' }}>
							Agregar compañero al grupo
						</h2>
						{candidatos.length === 0 ? (
							<p style={{ color: '#7a9ab5' }}>
								No hay compañeros disponibles en esta materia o ya están en el grupo.
							</p>
						) : (
							candidatos.map((c) => (
								<div key={c.id} className="uc-list-item">
									<div>
										<p style={{ margin: 0, fontWeight: 600, color: '#00284d' }}>
											{c.nombre} {c.apellido}
										</p>
										<p style={{ margin: 0, fontSize: 13, color: '#7a9ab5' }}>
											{c.correo}
										</p>
									</div>
									<button
										className="uc-btn success"
										style={{ padding: '6px 12px' }}
										onClick={() => handleAddMiembro(c.id)}
										disabled={agregandoId === c.id}
									>
										{agregandoId === c.id ? '...' : 'Agregar'}
									</button>
								</div>
							))
						)}
						<div style={{ marginTop: 20, textAlign: 'right' }}>
							<button className="uc-btn outline" onClick={() => setShowAddModal(false)}>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Transferir Admin */}
			{showTransferModal && (
				<div className="uc-modal-overlay" onClick={() => setShowTransferModal(false)}>
					<div className="uc-modal" onClick={(e) => e.stopPropagation()}>
						<h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#00284d' }}>
							Transferir administración
						</h2>
						<p style={{ color: '#7a9ab5', fontSize: 14, marginBottom: 16 }}>
							Elige a un miembro del grupo para que sea el nuevo administrador.
						</p>
						{grupo?.miembros?.filter((m) => m.id !== userId).length === 0 ? (
							<p style={{ color: '#e74c3c' }}>
								No hay otros miembros a los que transferir.
							</p>
						) : (
							grupo?.miembros
								?.filter((m) => m.id !== userId)
								.map((m) => (
									<div key={m.id} className="uc-list-item">
										<div>
											<p style={{ margin: 0, fontWeight: 600, color: '#00284d' }}>
												{m.nombre} {m.apellido}
											</p>
											<p style={{ margin: 0, fontSize: 13, color: '#7a9ab5' }}>
												{m.correo}
											</p>
										</div>
										<button
											className="uc-btn warning"
											style={{ padding: '6px 12px' }}
											onClick={() => handleTransferAdmin(m.id)}
											disabled={transferindoId === m.id}
										>
											{transferindoId === m.id ? '...' : 'Elegir'}
										</button>
									</div>
								))
						)}
						<div style={{ marginTop: 20, textAlign: 'right' }}>
							<button
								className="uc-btn outline"
								onClick={() => setShowTransferModal(false)}
							>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}

			{confirmAction && (
				<div className="uc-modal-overlay" onClick={() => setConfirmAction(null)}>
					<div
						className="uc-modal"
						onClick={(e) => e.stopPropagation()}
						style={{ maxWidth: 420 }}
					>
						<h2 style={{ margin: '0 0 12px', fontSize: 18, color: '#00284d' }}>
							{confirmAction.kind === 'abandonar' && 'Salir del grupo'}
							{confirmAction.kind === 'transferir' && 'Confirmar transferencia'}
							{confirmAction.kind === 'transferir-por-error' &&
								'Transferir administración'}
						</h2>
						<p
							style={{
								margin: '0 0 20px',
								color: '#4a6a85',
								fontSize: 14,
								lineHeight: 1.5,
							}}
						>
							{confirmAction.kind === 'abandonar' &&
								'¿Seguro que quieres abandonar este grupo?'}
							{confirmAction.kind === 'transferir' &&
								'¿Seguro que deseas transferir la administración a este miembro?'}
							{confirmAction.kind === 'transferir-por-error' &&
								'Para salir, primero debes transferir la administración a otro miembro del grupo.'}
						</p>
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
							<button className="uc-btn outline" onClick={() => setConfirmAction(null)}>
								Cancelar
							</button>
							{confirmAction.kind === 'abandonar' && (
								<button
									className="uc-btn danger"
									onClick={confirmarAbandono}
									disabled={abandonando}
								>
									{abandonando ? '...' : 'Aceptar'}
								</button>
							)}
							{confirmAction.kind === 'transferir' && (
								<button
									className="uc-btn warning"
									onClick={confirmarTransferencia}
									disabled={transferindoId === confirmAction.miembroId}
								>
									{transferindoId === confirmAction.miembroId ? '...' : 'Aceptar'}
								</button>
							)}
							{confirmAction.kind === 'transferir-por-error' && (
								<button
									className="uc-btn warning"
									onClick={() => {
										setConfirmAction(null);
										setShowTransferModal(true);
									}}
								>
									Ir a transferir
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	page: {
		minHeight: '100%',
		backgroundColor: '#f0f4f8',
		fontFamily: "'Inter', sans-serif",
	},
	content: { maxWidth: 800, margin: '0 auto', padding: '32px 20px 48px' },
	header: { marginBottom: 24 },
	title: { margin: '0 0 6px', fontSize: 26, fontWeight: 700, color: '#00284d' },
	subtitle: { margin: 0, fontSize: 15, color: '#7a9ab5' },
	actionsBar: {
		display: 'flex',
		gap: 12,
		flexWrap: 'wrap',
		alignItems: 'center',
		background: '#fff',
		padding: '16px',
		borderRadius: '12px',
		border: '1px solid #e8eef4',
	},
};
