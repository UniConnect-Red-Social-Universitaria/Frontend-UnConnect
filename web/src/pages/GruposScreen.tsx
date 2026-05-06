import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '@uniconnect/theme';
import { gruposService } from '../services/grupos.service';
import { materiasService } from '../services/materias.service';
import type { Grupo, Materia } from '../types/api.types';

const CSS = `
	.uc-group-card {
		background: #fff;
		border: 1px solid #e8eef4;
		border-radius: 14px;
		padding: 18px 20px;
		cursor: pointer;
		transition: box-shadow 0.18s, transform 0.18s;
	}
	.uc-group-card:hover {
		box-shadow: 0 6px 20px rgba(0,62,112,0.11);
		transform: translateY(-1px);
	}
	.uc-chip { 
		display: inline-block; padding: 4px 12px; border-radius: 20px;
		font-size: 12px; font-weight: 600; cursor: pointer;
		border: 1.5px solid transparent; transition: all 0.15s;
	}
	.uc-chip.active { background: #003e70; color: #fff; border-color: #003e70; }
	.uc-chip:not(.active) { background: #f0f4f8; color: #4a6a85; border-color: #dce6ef; }
	.uc-chip:not(.active):hover { border-color: #003e70; color: #003e70; }
	.uc-modal-overlay {
		position: fixed; inset: 0; background: rgba(0,0,0,0.45);
		z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px;
	}
	.uc-modal {
		background: #fff; border-radius: 18px; padding: 28px;
		max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0,0,0,0.2);
		animation: fadeUp 0.3s ease;
	}
	.uc-form-input {
		width: 100%; padding: 11px 13px;
		border: 1.5px solid #c5d3df; border-radius: 8px;
		font-size: 14px; font-family: 'Inter', sans-serif;
		color: #00284d; outline: none; transition: border-color 0.2s; box-sizing: border-box;
	}
	.uc-form-input:focus { border-color: #003e70; }
	.uc-btn-primary { 
		padding: 11px 20px; background: #003e70; color: #fff;
		border: none; border-radius: 9px; font-size: 14px;
		font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
		transition: background 0.2s;
	}
	.uc-btn-primary:hover:not(:disabled) { background: #00284d; }
	.uc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.uc-btn-secondary {
		padding: 11px 20px; background: transparent; color: #4a6a85;
		border: 1.5px solid #c5d3df; border-radius: 9px; font-size: 14px;
		font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
		transition: all 0.15s;
	}
	.uc-btn-secondary:hover { border-color: #003e70; color: #003e70; }
	@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
	@keyframes spin { to { transform: rotate(360deg); } }
`;

type GrupoDisponible = Grupo & { estado?: 'pendiente' | 'miembro' };

export default function GruposScreen() {
	const navigate = useNavigate();
	const [misGrupos, setMisGrupos] = useState<Grupo[]>([]);
	const [gruposDisponibles, setGruposDisponibles] = useState<GrupoDisponible[]>([]);
	const [materiasCatalogo, setMateriasCatalogo] = useState<Materia[]>([]);
	const [materiasUsuario, setMateriasUsuario] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showExplorar, setShowExplorar] = useState(false);
	const [showCrear, setShowCrear] = useState(false);
	const [processingId, setProcessingId] = useState<string | null>(null);

	// Crear grupo form
	const [nuevoNombre, setNuevoNombre] = useState('');
	const [nuevaMateria, setNuevaMateria] = useState('');
	const [creandoGrupo, setCreandoGrupo] = useState(false);
	const [crearError, setCrearError] = useState('');
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(
		null
	);

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	const cargarGrupos = async () => {
		setLoading(true);
		setError(null);
		try {
			const [mis, disponibles] = await Promise.all([
				gruposService.getGrupos(),
				gruposService.getGruposDisponibles(),
			]);
			setMisGrupos(mis);
			setGruposDisponibles(disponibles);
			const token = localStorage.getItem('userToken');
			if (token) {
				// Extraer materias del perfil
				try {
					const { apiClient } = await import('../api/apiClient');
					const perfil = await apiClient.get<any>('/api/usuarios/perfil');
					setMateriasUsuario(perfil.data?.materiasCursando ?? []);
				} catch {}
			}
		} catch (err: any) {
			setError(err.message || 'Error al cargar grupos');
		} finally {
			setLoading(false);
		}
	};

	const cargarMaterias = async () => {
		try {
			const materias = await materiasService.getMaterias();
			setMateriasCatalogo(materias);
		} catch {
			setMateriasCatalogo([]);
		}
	};

	useEffect(() => {
		cargarGrupos();
		cargarMaterias();
	}, []);

	const materiasPermitidas = materiasCatalogo.filter(
		(materia) =>
			materiasUsuario.includes(materia.nombre) ||
			materiasUsuario.includes(String(materia.id))
	);

	const handleSolicitarIngreso = async (grupoId: string) => {
		setProcessingId(grupoId);
		try {
			await gruposService.solicitarIngreso(grupoId);
			setGruposDisponibles((prev) =>
				prev.map((g) => (g.id === grupoId ? { ...g, estado: 'pendiente' } : g))
			);
			showMsg('Solicitud enviada correctamente');
		} catch (err: any) {
			showMsg(err.message || 'Error al enviar solicitud', 'error');
		} finally {
			setProcessingId(null);
		}
	};

	const handleCrearGrupo = async (e: React.FormEvent) => {
		e.preventDefault();
		setCrearError('');
		if (!nuevoNombre.trim()) {
			setCrearError('El nombre es obligatorio.');
			return;
		}
		if (!nuevaMateria.trim()) {
			setCrearError('Debes seleccionar una materia válida.');
			return;
		}
		setCreandoGrupo(true);
		try {
			await gruposService.crearGrupo({
				nombre: nuevoNombre.trim(),
				materiaId: nuevaMateria.trim(),
			});
			showMsg('Grupo creado exitosamente');
			setShowCrear(false);
			setNuevoNombre('');
			setNuevaMateria('');
			await cargarGrupos();
		} catch (err: any) {
			setCrearError(err.message || 'Error al crear el grupo');
		} finally {
			setCreandoGrupo(false);
		}
	};

	return (
		<div style={s.page}>
			<style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; } ${CSS}`}</style>

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
						animation: 'slideIn 0.25s ease',
					}}
				>
					{toast.msg}
				</div>
			)}

			<div style={s.content}>
				<div style={s.pageHeader}>
					<div>
						<h1 style={s.pageTitle}>Mis Grupos</h1>
						<p style={s.pageSubtitle}>Comunidad Universidad de Caldas</p>
					</div>
					<div style={{ display: 'flex', gap: 10 }}>
						<button className="uc-btn-secondary" onClick={() => setShowExplorar(true)}>
							🔍 Explorar
						</button>
						<button className="uc-btn-primary" onClick={() => setShowCrear(true)}>
							+ Crear grupo
						</button>
					</div>
				</div>

				{loading && (
					<div style={s.centered}>
						<div style={s.spinner} />
						<p style={{ color: '#7a9ab5', marginTop: 12 }}>Cargando grupos...</p>
					</div>
				)}

				{error && !loading && (
					<div style={s.errorBox}>
						⚠️ {error}
						<button
							className="uc-btn-secondary"
							onClick={cargarGrupos}
							style={{ marginLeft: 12, padding: '6px 12px' }}
						>
							Reintentar
						</button>
					</div>
				)}

				{!loading && !error && (
					<>
						{misGrupos.length === 0 ? (
							<div style={s.emptyState}>
								<span style={{ fontSize: 44 }}>👥</span>
								<p
									style={{
										fontSize: 16,
										fontWeight: 600,
										color: '#00284d',
										margin: '12px 0 4px',
									}}
								>
									Aún no perteneces a ningún grupo
								</p>
								<p style={{ color: '#7a9ab5', fontSize: 14 }}>
									Explora los grupos disponibles o crea el tuyo propio.
								</p>
							</div>
						) : (
							<div style={s.grid}>
								{misGrupos.map((g) => (
									<div
										key={g.id}
										className="uc-group-card"
										onClick={() => navigate(`/grupos/${g.id}`)}
									>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'flex-start',
												marginBottom: 8,
											}}
										>
											<h3
												style={{
													margin: 0,
													fontSize: 16,
													fontWeight: 700,
													color: '#00284d',
												}}
											>
												{g.nombre}
											</h3>
											<span
												style={{
													fontSize: 10,
													backgroundColor: '#eafaf1',
													color: '#1e8449',
													padding: '3px 8px',
													borderRadius: 20,
													fontWeight: 600,
												}}
											>
												Miembro ✓
											</span>
										</div>
										<p style={{ margin: '0 0 8px', fontSize: 13, color: '#4a6a85' }}>
											📚 {g.materia?.nombre ?? 'Materia no especificada'}
										</p>
										<p style={{ margin: 0, fontSize: 12, color: '#7a9ab5' }}>
											{g.cantidadMiembros ?? 0}{' '}
											{g.cantidadMiembros === 1 ? 'miembro' : 'miembros'}
										</p>
									</div>
								))}
							</div>
						)}
					</>
				)}
			</div>

			{/* Modal: Explorar grupos */}
			{showExplorar && (
				<div className="uc-modal-overlay" onClick={() => setShowExplorar(false)}>
					<div className="uc-modal" onClick={(e) => e.stopPropagation()}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 20,
							}}
						>
							<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#00284d' }}>
								🔍 Grupos disponibles
							</h2>
							<button
								onClick={() => setShowExplorar(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: 22,
									cursor: 'pointer',
									color: '#7a9ab5',
								}}
							>
								✕
							</button>
						</div>
						{gruposDisponibles.length === 0 ? (
							<p style={{ color: '#7a9ab5', textAlign: 'center', padding: '24px 0' }}>
								No hay grupos disponibles por ahora.
							</p>
						) : (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
								{gruposDisponibles.map((g) => {
									const esPendiente = g.estado === 'pendiente';
									return (
										<div
											key={g.id}
											style={{
												padding: '14px 16px',
												border: '1px solid #e8eef4',
												borderRadius: 12,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												gap: 12,
											}}
										>
											<div>
												<p
													style={{
														margin: '0 0 4px',
														fontWeight: 600,
														color: '#00284d',
														fontSize: 15,
													}}
												>
													{g.nombre}
												</p>
												<p style={{ margin: 0, fontSize: 13, color: '#7a9ab5' }}>
													📚 {g.materia?.nombre} · {g.cantidadMiembros ?? 0} miembros
												</p>
											</div>
											{esPendiente ? (
												<span
													style={{
														fontSize: 12,
														color: '#7a9ab5',
														fontWeight: 500,
														whiteSpace: 'nowrap',
													}}
												>
													Pendiente...
												</span>
											) : (
												<button
													className="uc-btn-primary"
													style={{
														padding: '7px 14px',
														fontSize: 13,
														whiteSpace: 'nowrap',
													}}
													onClick={() => handleSolicitarIngreso(g.id)}
													disabled={processingId === g.id}
												>
													{processingId === g.id ? '...' : '+ Unirse'}
												</button>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Modal: Crear grupo */}
			{showCrear && (
				<div className="uc-modal-overlay" onClick={() => setShowCrear(false)}>
					<div className="uc-modal" onClick={(e) => e.stopPropagation()}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 20,
							}}
						>
							<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#00284d' }}>
								➕ Crear grupo
							</h2>
							<button
								onClick={() => setShowCrear(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: 22,
									cursor: 'pointer',
									color: '#7a9ab5',
								}}
							>
								✕
							</button>
						</div>
						<form onSubmit={handleCrearGrupo}>
							<div style={{ marginBottom: 16 }}>
								<label style={s.label}>Nombre del grupo</label>
								<input
									className="uc-form-input"
									placeholder="Ej. Grupo de Cálculo 1"
									value={nuevoNombre}
									onChange={(e) => setNuevoNombre(e.target.value)}
									disabled={creandoGrupo}
								/>
							</div>
							<div style={{ marginBottom: 16 }}>
								<label style={s.label}>Materia</label>
								{materiasPermitidas.length > 0 ? (
									<select
										className="uc-form-input"
										value={nuevaMateria}
										onChange={(e) => setNuevaMateria(e.target.value)}
										disabled={creandoGrupo}
									>
										<option value="">Selecciona una materia</option>
										{materiasPermitidas.map((m) => (
											<option key={m.id} value={m.id}>
												{m.nombre}
											</option>
										))}
									</select>
								) : (
									<div style={{ fontSize: 13, color: '#7a9ab5', lineHeight: 1.5 }}>
										No se encontraron materias habilitadas en tu perfil académico. Revisa
										tu perfil para poder crear grupos.
									</div>
								)}
							</div>
							{crearError && (
								<p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>
									⚠️ {crearError}
								</p>
							)}
							<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
								<button
									type="button"
									className="uc-btn-secondary"
									onClick={() => setShowCrear(false)}
									disabled={creandoGrupo}
								>
									Cancelar
								</button>
								<button type="submit" className="uc-btn-primary" disabled={creandoGrupo}>
									{creandoGrupo ? '...' : 'Crear grupo'}
								</button>
							</div>
						</form>
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
	content: { maxWidth: 760, margin: '0 auto', padding: '32px 20px 48px' },
	pageHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 28,
		flexWrap: 'wrap',
		gap: 12,
	},
	pageTitle: { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#00284d' },
	pageSubtitle: { margin: 0, fontSize: 14, color: '#7a9ab5' },
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
		gap: 16,
	},
	centered: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		padding: '64px 0',
	},
	spinner: {
		width: 36,
		height: 36,
		border: '3px solid #dce6ef',
		borderTopColor: theme.colors.primary,
		borderRadius: '50%',
		animation: 'spin 0.8s linear infinite',
	},
	errorBox: {
		backgroundColor: '#fdf0f0',
		border: '1px solid #f5c6cb',
		borderRadius: 10,
		padding: '14px 18px',
		color: '#c0392b',
		fontSize: 14,
		display: 'flex',
		alignItems: 'center',
	},
	emptyState: { textAlign: 'center', padding: '64px 0' },
	label: {
		display: 'block',
		marginBottom: 6,
		fontSize: 13,
		fontWeight: 600,
		color: '#00284d',
	},
};
