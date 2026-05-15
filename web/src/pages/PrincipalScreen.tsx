import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '@uniconnect/theme';
import { usuariosService } from '../services/usuarios.service';
import { materiasService } from '../services/materias.service';
import { authService } from '../services/auth.service';
import { onboardingService } from '../services/onboarding.service';
import type { Usuario, Materia } from '../types/api.types';

export default function PrincipalScreen() {
	const navigate = useNavigate();

	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [materiaResults, setMateriaResults] = useState<Materia[]>([]);
	const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
	const [companerosResults, setCompanerosResults] = useState<Usuario[]>([]);
	const [loadingCompaneros, setLoadingCompaneros] = useState(false);
	const [contactIds, setContactIds] = useState<Set<string>>(new Set());
	const [solicitudesEnviadasIds, setSolicitudesEnviadasIds] = useState<Set<string>>(new Set());
	const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [onboardingStep, setOnboardingStep] = useState(0);
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
	const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	// Cargar userId y compañeros existentes
	useEffect(() => {
		authService.obtenerIdUsuarioActual().then(setCurrentUserId);
		usuariosService.getCompaneros().then((c) => {
			setContactIds(new Set(c.map((x) => x.id)));
		});
		// Onboarding
		if (onboardingService.shouldShowPrincipalOnboarding()) {
			setShowOnboarding(true);
		}
	}, []);

	// Búsqueda de materias con debounce
	useEffect(() => {
		if (searchRef.current) clearTimeout(searchRef.current);
		if (!search.trim()) {
			setMateriaResults([]);
			return;
		}
		searchRef.current = setTimeout(async () => {
			try {
				const res = await materiasService.buscarMaterias(search);
				setMateriaResults(res);
			} catch {}
		}, 300);
		return () => { if (searchRef.current) clearTimeout(searchRef.current); };
	}, [search]);

	// Buscar compañeros por materia seleccionada
	useEffect(() => {
		if (!selectedMateria) return;
		setLoadingCompaneros(true);
		usuariosService
			.buscarPorMateria(selectedMateria)
			.then((res) => {
				const filtrados = res.filter((u) => u.id !== currentUserId);
				setCompanerosResults(filtrados);
			})
			.catch(() => setCompanerosResults([]))
			.finally(() => setLoadingCompaneros(false));
	}, [selectedMateria, currentUserId]);

	const handleEnviarSolicitud = async (usuarioId: string) => {
		if (contactIds.has(usuarioId) || solicitudesEnviadasIds.has(usuarioId)) return;
		setSendingIds((p) => new Set(p).add(usuarioId));
		try {
			await usuariosService.enviarSolicitud(usuarioId);
			setSolicitudesEnviadasIds((p) => new Set(p).add(usuarioId));
			showMsg('Solicitud enviada correctamente');
		} catch (err: any) {
			showMsg(err.message || 'Error al enviar la solicitud', 'error');
		} finally {
			setSendingIds((p) => { const n = new Set(p); n.delete(usuarioId); return n; });
		}
	};

	const onboardingSteps = [
		{ icon: '✨', title: 'Bienvenido 👋', desc: 'Encuentra tu comunidad dentro de la universidad.' },
		{ icon: '🔍', title: 'Busca fácilmente', desc: 'Busca materias para conectar con compañeros.' },
		{ icon: '🔔', title: 'Notificaciones', desc: 'Revisa tus notificaciones y solicitudes.' },
		{ icon: '🗂️', title: 'Explora', desc: 'Navega por grupos, eventos y contactos.' },
		{ icon: '🚀', title: '¡Todo listo! 🎉', desc: 'Empieza a explorar y conecta con la U.' },
	];

	const closeOnboarding = () => {
		setShowOnboarding(false);
		onboardingService.completePrincipalOnboarding();
	};

	const materiaSeleccionadaLabel = selectedMateria
		? materiaResults.find((m) => m.id === selectedMateria)?.nombre ?? 'Materia seleccionada'
		: null;

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				.uc-search-input {
					width: 100%;
					padding: 12px 16px;
					border: 1.5px solid #c5d3df;
					border-radius: 10px;
					font-size: 15px;
					font-family: 'Inter', sans-serif;
					color: #00284d;
					outline: none;
					transition: border-color 0.2s, box-shadow 0.2s;
					background: #fff;
				}
				.uc-search-input:focus {
					border-color: #003e70;
					box-shadow: 0 0 0 3px rgba(0,62,112,0.1);
				}
				.uc-materia-item {
					padding: 10px 14px;
					cursor: pointer;
					border-radius: 8px;
					font-size: 14px;
					color: #00284d;
					transition: background 0.12s;
				}
				.uc-materia-item:hover { background: #f0f4f8; }
				.uc-materia-item.selected {
					background: #003e70;
					color: #fff;
					font-weight: 600;
				}
				.uc-user-card {
					display: flex;
					align-items: center;
					gap: 14px;
					padding: 14px 16px;
					border-radius: 12px;
					background: #fff;
					border: 1px solid #e8eef4;
					transition: box-shadow 0.15s;
				}
				.uc-user-card:hover { box-shadow: 0 4px 12px rgba(0,62,112,0.08); }
				.uc-avatar {
					width: 44px;
					height: 44px;
					border-radius: 50%;
					background: linear-gradient(135deg, #003e70, #007ad4);
					display: flex;
					align-items: center;
					justify-content: center;
					color: #fff;
					font-size: 16px;
					font-weight: 700;
					flex-shrink: 0;
				}
				.uc-btn-sm {
					padding: 7px 14px;
					border-radius: 8px;
					font-size: 13px;
					font-weight: 600;
					cursor: pointer;
					border: none;
					font-family: 'Inter', sans-serif;
					transition: all 0.15s;
					white-space: nowrap;
				}
				.uc-btn-sm.primary {
					background: #003e70;
					color: #fff;
				}
				.uc-btn-sm.primary:hover:not(:disabled) { background: #00284d; }
				.uc-btn-sm.sent {
					background: #e8eef4;
					color: #7a9ab5;
					cursor: default;
				}
				.uc-btn-sm.contact {
					background: #eafaf1;
					color: #1e8449;
					cursor: default;
				}
				.uc-btn-sm:disabled { opacity: 0.6; cursor: not-allowed; }
				@keyframes spin { to { transform: rotate(360deg); } }
				@keyframes fadeUp {
					from { opacity: 0; transform: translateY(16px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				@keyframes slideIn {
					from { opacity: 0; transform: translateX(60px); }
					to   { opacity: 1; transform: translateX(0); }
				}
			`}</style>

			{/* Toast */}
			{toast && (
				<div style={{
					position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
					backgroundColor: toast.type === 'error' ? '#c0392b' : '#27ae60',
					color: '#fff', padding: '12px 20px', borderRadius: 10,
					fontSize: 14, fontWeight: 500,
					boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
					animation: 'slideIn 0.25s ease',
				}}>
					{toast.msg}
				</div>
			)}

			{/* Onboarding overlay */}
			{showOnboarding && (
				<div style={s.onboardingOverlay}>
					<div style={s.onboardingCard}>
						<div style={s.onboardingIcon}>{onboardingSteps[onboardingStep].icon}</div>
						<h3 style={s.onboardingTitle}>{onboardingSteps[onboardingStep].title}</h3>
						<p style={s.onboardingDesc}>{onboardingSteps[onboardingStep].desc}</p>
						<div style={s.onboardingDots}>
							{onboardingSteps.map((_, i) => (
								<div
									key={i}
									style={{
										width: 8, height: 8, borderRadius: '50%',
										backgroundColor: i === onboardingStep ? theme.colors.primary : '#c5d3df',
										transition: 'background 0.2s',
									}}
								/>
							))}
						</div>
						<div style={s.onboardingActions}>
							<button
								style={{ ...s.onboardingBtn, background: 'transparent', color: '#7a9ab5', border: '1px solid #c5d3df' }}
								onClick={closeOnboarding}
							>
								Omitir
							</button>
							<button
								style={{ ...s.onboardingBtn, background: theme.colors.primary, color: '#fff' }}
								onClick={() => {
									if (onboardingStep < onboardingSteps.length - 1) {
										setOnboardingStep((s) => s + 1);
									} else {
										closeOnboarding();
									}
								}}
							>
								{onboardingStep === onboardingSteps.length - 1 ? '¡Comenzar!' : 'Siguiente'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Contenido */}
			<div style={s.content}>
				<h1 style={s.pageTitle}>Inicio</h1>
				<p style={s.pageSubtitle}>
					Busca materias para encontrar compañeros de estudio
				</p>

				{/* Barra de búsqueda */}
				<div style={s.searchSection}>
					<input
						id="buscar-materia"
						className="uc-search-input"
						type="text"
						placeholder="🔍  Buscar materias..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>

					{/* Resultados de materias */}
					{materiaResults.length > 0 && search.trim() && (
						<div style={s.materiasDropdown}>
							{materiaResults.map((m) => (
								<div
									key={m.id}
									className={`uc-materia-item${selectedMateria === m.id ? ' selected' : ''}`}
									onClick={() => {
										setSelectedMateria(m.id);
										setSearch(m.nombre);
										setMateriaResults([]);
									}}
								>
									📚 {m.nombre}
								</div>
							))}
						</div>
					)}
				</div>

				{/* Sección de compañeros */}
				{selectedMateria && (
					<div style={s.companerosSection}>
						<div style={s.sectionHeader}>
							<h2 style={s.sectionTitle}>
								Compañeros en{' '}
								<span style={{ color: theme.colors.primary }}>{materiaSeleccionadaLabel}</span>
							</h2>
							<button
								style={s.clearBtn}
								onClick={() => {
									setSelectedMateria(null);
									setSearch('');
									setCompanerosResults([]);
								}}
							>
								✕ Limpiar
							</button>
						</div>

						{loadingCompaneros ? (
							<div style={s.loadingWrap}>
								<div style={s.spinner} />
								<p style={{ color: '#7a9ab5', marginTop: 12, fontSize: 14 }}>
									Buscando compañeros...
								</p>
							</div>
						) : companerosResults.length === 0 ? (
							<div style={s.emptyState}>
								<span style={{ fontSize: 40 }}>🎓</span>
								<p style={{ color: '#7a9ab5', fontSize: 15, margin: '8px 0 0' }}>
									No se encontraron compañeros en esta materia.
								</p>
							</div>
						) : (
							<div style={s.usersList}>
								{companerosResults.map((usuario) => {
									const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();
									const initials = [usuario.nombre[0], usuario.apellido?.[0]]
										.filter(Boolean)
										.join('')
										.toUpperCase();
									const esContacto = contactIds.has(usuario.id);
									const solicitudEnviada = solicitudesEnviadasIds.has(usuario.id);
									const enviando = sendingIds.has(usuario.id);

									return (
										<div key={usuario.id} className="uc-user-card">
											<div className="uc-avatar">{initials}</div>
											<div style={{ flex: 1, minWidth: 0 }}>
												<p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#00284d' }}>
													{nombreCompleto}
												</p>
												<p style={{ margin: '2px 0 0', fontSize: 13, color: '#7a9ab5' }}>
													{usuario.correo}
												</p>
												{usuario.carrera && (
													<p style={{ margin: '2px 0 0', fontSize: 12, color: '#4a6a85' }}>
														{usuario.carrera}
														{usuario.semestre ? ` · Semestre ${usuario.semestre}` : ''}
													</p>
												)}
											</div>
											{esContacto ? (
												<button className="uc-btn-sm contact" disabled>
													✓ Contacto
												</button>
											) : solicitudEnviada ? (
												<button className="uc-btn-sm sent" disabled>
													Enviada
												</button>
											) : (
												<button
													className="uc-btn-sm primary"
													onClick={() => handleEnviarSolicitud(usuario.id)}
													disabled={enviando}
												>
													{enviando ? (
														<span style={{
															display: 'inline-block',
															width: 14, height: 14,
															border: '2px solid rgba(255,255,255,0.4)',
															borderTopColor: '#fff',
															borderRadius: '50%',
															animation: 'spin 0.7s linear infinite',
															verticalAlign: 'middle',
														}} />
													) : '+ Conectar'}
												</button>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}

				{/* Estado vacío inicial */}
				{!selectedMateria && !search.trim() && (
					<div style={s.welcomeCards}>
						{[
							{ icon: '👥', title: 'Grupos de estudio', desc: 'Únete o crea grupos para tu materia', path: '/grupos' },
							{ icon: '📅', title: 'Eventos académicos', desc: 'Descubre eventos y actividades', path: '/eventos' },
							{ icon: '💬', title: 'Contactos', desc: 'Chatea con tus compañeros', path: '/contactos' },
							{ icon: '📨', title: 'Solicitudes', desc: 'Gestiona tus solicitudes pendientes', path: '/solicitudes' },
						].map((card) => (
							<button
								key={card.path}
								style={s.welcomeCard}
								onClick={() => navigate(card.path)}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLButtonElement).style.boxShadow =
										'0 8px 24px rgba(0,62,112,0.14)';
									(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLButtonElement).style.boxShadow =
										'0 2px 8px rgba(0,62,112,0.06)';
									(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
								}}
							>
								<span style={{ fontSize: 28 }}>{card.icon}</span>
								<div style={{ textAlign: 'left' }}>
									<p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#00284d' }}>
										{card.title}
									</p>
									<p style={{ margin: '2px 0 0', fontSize: 13, color: '#7a9ab5' }}>
										{card.desc}
									</p>
								</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	page: {
		minHeight: '100%',
		backgroundColor: '#f0f4f8',
		fontFamily: "'Inter', sans-serif",
	},
	content: {
		maxWidth: 700,
		margin: '0 auto',
		padding: '32px 20px 48px',
	},
	pageTitle: {
		margin: '0 0 4px',
		fontSize: 26,
		fontWeight: 700,
		color: theme.colors.primaryDark,
	},
	pageSubtitle: {
		margin: '0 0 28px',
		fontSize: 15,
		color: '#7a9ab5',
	},
	searchSection: {
		position: 'relative',
		marginBottom: 28,
	},
	materiasDropdown: {
		position: 'absolute',
		top: '100%',
		left: 0, right: 0,
		marginTop: 4,
		backgroundColor: '#fff',
		borderRadius: 10,
		border: '1.5px solid #dce6ef',
		boxShadow: '0 8px 24px rgba(0,62,112,0.12)',
		zIndex: 50,
		maxHeight: 280,
		overflowY: 'auto',
		padding: 8,
	},
	companerosSection: {
		animation: 'fadeUp 0.3s ease both',
	},
	sectionHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	sectionTitle: {
		margin: 0,
		fontSize: 18,
		fontWeight: 600,
		color: '#00284d',
	},
	clearBtn: {
		background: 'none',
		border: '1px solid #c5d3df',
		borderRadius: 8,
		padding: '5px 10px',
		fontSize: 13,
		color: '#7a9ab5',
		cursor: 'pointer',
		fontFamily: "'Inter', sans-serif",
	},
	loadingWrap: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		padding: '48px 0',
	},
	spinner: {
		width: 36,
		height: 36,
		border: '3px solid #dce6ef',
		borderTopColor: theme.colors.primary,
		borderRadius: '50%',
		animation: 'spin 0.8s linear infinite',
	},
	emptyState: {
		textAlign: 'center',
		padding: '48px 0',
	},
	usersList: {
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
	},
	welcomeCards: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
		gap: 16,
		marginTop: 8,
	},
	welcomeCard: {
		display: 'flex',
		alignItems: 'center',
		gap: 16,
		backgroundColor: '#fff',
		border: '1px solid #e8eef4',
		borderRadius: 14,
		padding: '18px 20px',
		cursor: 'pointer',
		textAlign: 'left',
		boxShadow: '0 2px 8px rgba(0,62,112,0.06)',
		transition: 'box-shadow 0.2s, transform 0.2s',
		fontFamily: "'Inter', sans-serif",
		width: '100%',
	},
	onboardingOverlay: {
		position: 'fixed',
		inset: 0,
		backgroundColor: 'rgba(0,0,0,0.5)',
		zIndex: 1000,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	onboardingCard: {
		backgroundColor: '#fff',
		borderRadius: 20,
		padding: '36px 32px',
		maxWidth: 380,
		width: '100%',
		textAlign: 'center',
		boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
		animation: 'fadeUp 0.3s ease',
	},
	onboardingIcon: {
		fontSize: 48,
		marginBottom: 16,
	},
	onboardingTitle: {
		margin: '0 0 10px',
		fontSize: 20,
		fontWeight: 700,
		color: theme.colors.primaryDark,
	},
	onboardingDesc: {
		margin: '0 0 24px',
		fontSize: 15,
		color: '#7a9ab5',
		lineHeight: 1.5,
	},
	onboardingDots: {
		display: 'flex',
		justifyContent: 'center',
		gap: 8,
		marginBottom: 24,
	},
	onboardingActions: {
		display: 'flex',
		gap: 12,
	},
	onboardingBtn: {
		flex: 1,
		padding: '11px 0',
		borderRadius: 10,
		fontSize: 15,
		fontWeight: 600,
		cursor: 'pointer',
		border: 'none',
		fontFamily: "'Inter', sans-serif",
		transition: 'opacity 0.15s',
	},
};