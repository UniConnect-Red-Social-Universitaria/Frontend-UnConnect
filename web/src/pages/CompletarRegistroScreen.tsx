import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import theme from '@uniconnect/theme';
import { authService } from '../services/auth.service';
import { apiClient } from '../api/apiClient';
import { onboardingService } from '../services/onboarding.service';
import { useAuth } from '../context/AuthContext';
import { useAuth0Web } from '../hooks/useAuth0Web';
import type { Carrera, MateriaCatalogo } from '../types/api.types';

export default function CompletarRegistroScreen() {
	const navigate = useNavigate();
	const location = useLocation();
	const { onLoginSuccess } = useAuth();
	const { handleCallback, loading: auth0Loading, error: auth0Error } = useAuth0Web();
	const locationData = (location.state as any)?.googleData || {};
	const [auth0Token, setAuth0Token] = useState<string>(locationData.googleIdToken || '');
	const [callbackProcessed, setCallbackProcessed] = useState(false);
	const [nombre, setNombre] = useState(locationData.nombre || '');
	const [apellido, setApellido] = useState(locationData.apellido || '');
	const [correo, setCorreo] = useState(locationData.correo || '');
	const [contrasena, setContrasena] = useState('');
	const [selectedCarreraId, setSelectedCarreraId] = useState('');
	const [semestre, setSemestre] = useState('');
	const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);
	const [materiaBusqueda, setMateriaBusqueda] = useState('');

	const [carrerasList, setCarrerasList] = useState<Carrera[]>([]);
	const [materiasList, setMateriasList] = useState<MateriaCatalogo[]>([]);
	const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
	const [estaCargando, setEstaCargando] = useState(false);
	const [mensajeExito, setMensajeExito] = useState('');

	const [errores, setErrores] = useState({
		nombre: '',
		apellido: '',
		correo: '',
		contrasena: '',
		carrera: '',
		semestre: '',
		materias: '',
		general: '',
	});

	useEffect(() => {
		const cargarCatalogos = async () => {
			try {
				try {
					await apiClient.post('/api/catalogos/poblar');
				} catch {}
				const response = await apiClient.get<{
					carreras: Carrera[];
					materias: MateriaCatalogo[];
				}>('/api/catalogos');
				if (response.success && response.data) {
					setCarrerasList(response.data.carreras);
					setMateriasList(response.data.materias);
				}
			} catch (err: any) {
				setErrores((p) => ({
					...p,
					general: err.message || 'Error al cargar catálogos.',
				}));
			} finally {
				setCargandoCatalogos(false);
			}
		};
		cargarCatalogos();
	}, []);

	useEffect(() => {
		if (callbackProcessed) return;

		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		const state = params.get('state');
		const errorParam = params.get('error');

		if (errorParam) {
			setErrores((p) => ({
				...p,
				general: params.get('error_description') || 'Auth0 devolvió un error.',
			}));
			setCallbackProcessed(true);
			window.history.replaceState({}, '', window.location.pathname);
			return;
		}

		if (!code || !state) return;

		setCallbackProcessed(true);
		window.history.replaceState({}, '', window.location.pathname);

		handleCallback(code, state).then((result) => {
			if (!result) return;

			const { idToken, profile } = result;
			setAuth0Token(idToken);
			if (profile.given_name || profile.name) {
				setNombre(profile.given_name || profile.name?.split(' ')[0] || '');
			}
			if (profile.family_name || profile.name) {
				setApellido(profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '');
			}
			if (profile.email) {
				setCorreo(profile.email.toLowerCase());
			}
		});
	}, [callbackProcessed, handleCallback]);

	const toggleMateria = (id: string) => {
		setSelectedMaterias((prev) =>
			prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
		);
		setErrores((p) => ({ ...p, materias: '' }));
	};

	const validar = () => {
		const e = {
			nombre: '',
			apellido: '',
			correo: '',
			contrasena: '',
			carrera: '',
			semestre: '',
			materias: '',
			general: '',
		};
		let ok = true;

		if (!nombre.trim()) {
			e.nombre = 'El nombre es obligatorio.';
			ok = false;
		}
		if (!apellido.trim()) {
			e.apellido = 'El apellido es obligatorio.';
			ok = false;
		}
		const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const allowedDomain = 'ucaldas.edu.co';
		if (!correo.trim() || !emailReg.test(correo)) {
			e.correo = 'Ingresa un correo válido.';
			ok = false;
		} else if (!correo.toLowerCase().endsWith(`@${allowedDomain}`)) {
			e.correo = `Por favor, utiliza exclusivamente tu correo institucional (@${allowedDomain}).`;
			ok = false;
		}
		if (contrasena.trim().length < 8) {
			e.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
			ok = false;
		}
		if (!selectedCarreraId) {
			e.carrera = 'Selecciona tu carrera.';
			ok = false;
		}
		const sem = parseInt(semestre);
		if (!semestre || isNaN(sem) || sem < 1 || sem > 20) {
			e.semestre = 'Ingresa un semestre válido (1-20).';
			ok = false;
		}
		if (selectedMaterias.length === 0) {
			e.materias = 'Selecciona al menos una materia.';
			ok = false;
		}

		setErrores(e);
		return ok;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validar()) return;
		if (!auth0Token) {
			setErrores((p) => ({
				...p,
				general: 'No se encontró el token de Auth0. Vuelve a iniciar el registro.',
			}));
			return;
		}

		const materiasNombres = selectedMaterias
			.map((id) => materiasList.find((m) => String(m.id) === id)?.nombre)
			.filter((n): n is string => Boolean(n));

		setEstaCargando(true);
		try {
			const resp = await authService.registro({
				nombre: nombre.trim(),
				apellido: apellido.trim(),
				correo: correo.trim(),
				googleIdToken: auth0Token,
				contrasena,
				carrera: selectedCarreraId,
				semestre: parseInt(semestre),
				materiasCursando: materiasNombres,
			});

			if (!resp.success) {
				setErrores((p) => ({ ...p, general: resp.message || 'Error en el registro.' }));
				return;
			}

			setMensajeExito('¡Bienvenido a UniConnect! Tu cuenta ha sido creada exitosamente.');
			onboardingService.markPrincipalOnboardingPending();
			await onLoginSuccess();

			setTimeout(() => navigate('/principal', { replace: true }), 1800);
		} catch (err: any) {
			setErrores((p) => ({
				...p,
				general: err.message || 'Ocurrió un problema de conexión.',
			}));
		} finally {
			setEstaCargando(false);
		}
	};

	const materiasFiltradas = materiasList.filter((m) =>
		m.nombre.toLowerCase().includes(materiaBusqueda.toLowerCase())
	);

	return (
		<div style={s.screen}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				body { margin: 0; }
				.uc-input {
					width: 100%;
					padding: 11px 13px;
					border: 1.5px solid #c5d3df;
					border-radius: 8px;
					font-size: 14px;
					font-family: 'Inter', sans-serif;
					color: #00284d;
					background: #fff;
					outline: none;
					transition: border-color 0.2s;
				}
				.uc-input:focus { border-color: #003e70; }
				.uc-input.error { border-color: #e74c3c; }
				.uc-btn-primary {
					width: 100%;
					padding: 14px;
					background: #003e70;
					color: #fff;
					border: none;
					border-radius: 10px;
					font-size: 16px;
					font-weight: 600;
					cursor: pointer;
					font-family: 'Inter', sans-serif;
					transition: background 0.2s;
				}
				.uc-btn-primary:hover:not(:disabled) { background: #00284d; }
				.uc-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
				.materia-tag {
					display: inline-flex;
					align-items: center;
					gap: 6px;
					padding: 5px 10px;
					border-radius: 20px;
					font-size: 12px;
					font-weight: 500;
					cursor: pointer;
					border: 1.5px solid transparent;
					transition: all 0.15s;
				}
				.materia-tag.selected {
					background: #003e70;
					color: #fff;
					border-color: #003e70;
				}
				.materia-tag:not(.selected) {
					background: #f0f4f8;
					color: #00284d;
					border-color: #c5d3df;
				}
				.materia-tag:hover:not(.selected) {
					border-color: #003e70;
					background: #e8eef4;
				}
				@keyframes spin { to { transform: rotate(360deg); } }
				@keyframes fadeUp {
					from { opacity: 0; transform: translateY(20px); }
					to   { opacity: 1; transform: translateY(0); }
				}
			`}</style>

			{/* Header */}
			<header style={s.header}>
				<h1 style={s.headerTitle}>UniConnect</h1>
			</header>

			<main style={s.main}>
				<div style={s.card}>
					<h2 style={s.title}>Completa tu perfil</h2>
					<p style={s.subtitle}>
						Necesitamos algunos datos académicos para finalizar tu registro.
					</p>

					{/* Mensaje de éxito */}
					{mensajeExito && (
						<div style={s.successBox}>
							<span>✅</span> {mensajeExito}
						</div>
					)}

					{/* Estado del callback de Auth0 */}
					{auth0Loading && (
						<div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#eaf4fb', border: '1px solid #aed6f1', borderRadius: 8, padding: '10px 14px', color: '#1a5276', fontSize: 14, marginBottom: 16 }}>
							<span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(26,82,118,0.3)', borderTopColor: '#1a5276', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
							Verificando tu cuenta con Auth0...
						</div>
					)}
					{auth0Error && (
						<div style={s.errorBox}>
							<span>⚠️</span> {auth0Error}
						</div>
					)}

					<form onSubmit={handleSubmit} noValidate>
						{/* Nombre y apellido */}
						<div style={s.row}>
							<div style={{ flex: 1 }}>
								<label style={s.label}>Nombre</label>
								<input
									id="nombre"
									className={`uc-input${errores.nombre ? ' error' : ''}`}
									placeholder="Tu nombre"
									value={nombre}
									onChange={(e) => {
										setNombre(e.target.value);
										setErrores((p) => ({ ...p, nombre: '' }));
									}}
									disabled={estaCargando}
								/>
								{errores.nombre && <p style={s.errorText}>{errores.nombre}</p>}
							</div>
							<div style={{ flex: 1 }}>
								<label style={s.label}>Apellido</label>
								<input
									id="apellido"
									className={`uc-input${errores.apellido ? ' error' : ''}`}
									placeholder="Tu apellido"
									value={apellido}
									onChange={(e) => {
										setApellido(e.target.value);
										setErrores((p) => ({ ...p, apellido: '' }));
									}}
									disabled={estaCargando}
								/>
								{errores.apellido && <p style={s.errorText}>{errores.apellido}</p>}
							</div>
						</div>

						{/* Correo */}
						<div style={s.inputGroup}>
							<label style={s.label}>Correo institucional</label>
							<input
								id="correo"
								type="email"
								className={`uc-input${errores.correo ? ' error' : ''}`}
								placeholder="ejemplo@ucaldas.edu.co"
								value={correo}
								onChange={(e) => {
									setCorreo(e.target.value);
									setErrores((p) => ({ ...p, correo: '' }));
								}}
								disabled={estaCargando}
							/>
							{errores.correo && <p style={s.errorText}>{errores.correo}</p>}
						</div>

						{/* Contraseña */}
						<div style={s.inputGroup}>
							<label style={s.label}>Contraseña</label>
							<input
								id="contrasena"
								type="password"
								className={`uc-input${errores.contrasena ? ' error' : ''}`}
								placeholder="Mínimo 8 caracteres"
								value={contrasena}
								onChange={(e) => {
									setContrasena(e.target.value);
									setErrores((p) => ({ ...p, contrasena: '' }));
								}}
								disabled={estaCargando}
								autoComplete="new-password"
							/>
							{errores.contrasena && <p style={s.errorText}>{errores.contrasena}</p>}
						</div>

						{/* Carrera + Semestre */}
						<div style={s.row}>
							<div style={{ flex: 2 }}>
								<label style={s.label}>Carrera</label>
								<select
									id="carrera"
									className={`uc-input${errores.carrera ? ' error' : ''}`}
									value={selectedCarreraId}
									onChange={(e) => {
										setSelectedCarreraId(e.target.value);
										setErrores((p) => ({ ...p, carrera: '' }));
									}}
									disabled={estaCargando || cargandoCatalogos}
									style={{ cursor: 'pointer' }}
								>
									<option value="">
										{cargandoCatalogos ? 'Cargando...' : 'Selecciona tu carrera'}
									</option>
									{carrerasList.map((c) => (
										<option key={c.id} value={String(c.id)}>
											{c.nombre}
										</option>
									))}
								</select>
								{errores.carrera && <p style={s.errorText}>{errores.carrera}</p>}
							</div>
							<div style={{ flex: 1 }}>
								<label style={s.label}>Semestre</label>
								<input
									id="semestre"
									type="number"
									min={1}
									max={20}
									className={`uc-input${errores.semestre ? ' error' : ''}`}
									placeholder="Ej. 5"
									value={semestre}
									onChange={(e) => {
										setSemestre(e.target.value);
										setErrores((p) => ({ ...p, semestre: '' }));
									}}
									disabled={estaCargando}
								/>
								{errores.semestre && <p style={s.errorText}>{errores.semestre}</p>}
							</div>
						</div>

						{/* Materias */}
						<div style={s.inputGroup}>
							<label style={s.label}>
								Materias que estás cursando{' '}
								{selectedMaterias.length > 0 && (
									<span style={s.badge}>{selectedMaterias.length} seleccionada(s)</span>
								)}
							</label>

							<input
								className="uc-input"
								placeholder="Buscar materia..."
								value={materiaBusqueda}
								onChange={(e) => setMateriaBusqueda(e.target.value)}
								disabled={estaCargando || cargandoCatalogos}
								style={{ marginBottom: 10 }}
							/>

							{cargandoCatalogos ? (
								<p style={{ color: theme.colors.primaryMid, fontSize: 13 }}>
									Cargando materias...
								</p>
							) : (
								<div style={s.materiasGrid}>
									{materiasFiltradas.slice(0, 60).map((m) => {
										const id = String(m.id);
										const sel = selectedMaterias.includes(id);
										return (
											<button
												key={id}
												type="button"
												className={`materia-tag${sel ? ' selected' : ''}`}
												onClick={() => toggleMateria(id)}
												disabled={estaCargando}
											>
												{sel && '✓ '}
												{m.nombre}
											</button>
										);
									})}
									{materiasFiltradas.length === 0 && (
										<p style={{ color: '#999', fontSize: 13 }}>
											No se encontraron materias.
										</p>
									)}
								</div>
							)}
							{errores.materias && <p style={s.errorText}>{errores.materias}</p>}
						</div>

						{/* Error general */}
						{errores.general && (
							<div style={s.errorBox}>
								<span>⚠️</span> {errores.general}
							</div>
						)}

						{/* Botones */}
						<button
							type="submit"
							className="uc-btn-primary"
							disabled={estaCargando}
							style={{ marginTop: 8 }}
						>
							{estaCargando ? (
								<span
									style={{
										display: 'inline-block',
										width: 18,
										height: 18,
										border: '2.5px solid rgba(255,255,255,0.4)',
										borderTopColor: '#fff',
										borderRadius: '50%',
										animation: 'spin 0.7s linear infinite',
										verticalAlign: 'middle',
									}}
								/>
							) : (
								'Finalizar Registro'
							)}
						</button>

						<div style={s.footer}>
							<button
								type="button"
								style={s.linkBtn}
								onClick={() => navigate('/registro')}
								disabled={estaCargando}
							>
								← Volver
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	screen: {
		minHeight: '100dvh',
		display: 'flex',
		flexDirection: 'column',
		backgroundColor: '#f0f4f8',
		fontFamily: "'Inter', sans-serif",
	},
	header: {
		backgroundColor: theme.colors.primary,
		borderBottom: `3px solid ${theme.colors.gold}`,
		padding: '14px 24px',
	},
	headerTitle: {
		margin: 0,
		color: theme.colors.gold,
		fontSize: 22,
		fontWeight: 700,
	},
	main: {
		flex: 1,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '32px 16px',
	},
	card: {
		backgroundColor: '#fff',
		borderRadius: 16,
		boxShadow: '0 8px 32px rgba(0,62,112,0.12)',
		padding: '36px 32px',
		maxWidth: 600,
		width: '100%',
		animation: 'fadeUp 0.45s ease both',
	},
	title: {
		margin: '0 0 6px',
		fontSize: 22,
		fontWeight: 700,
		color: theme.colors.primaryDark,
		textAlign: 'center',
	},
	subtitle: {
		margin: '0 0 24px',
		fontSize: 14,
		color: theme.colors.primaryMid,
		textAlign: 'center',
	},
	row: {
		display: 'flex',
		gap: 12,
		marginBottom: 18,
	},
	inputGroup: {
		marginBottom: 18,
	},
	label: {
		display: 'block',
		marginBottom: 6,
		fontSize: 13,
		fontWeight: 600,
		color: theme.colors.primaryDark,
	},
	badge: {
		display: 'inline-block',
		backgroundColor: theme.colors.primary,
		color: '#fff',
		fontSize: 11,
		padding: '2px 8px',
		borderRadius: 20,
		marginLeft: 6,
		fontWeight: 600,
	},
	errorText: {
		margin: '4px 0 0',
		fontSize: 12,
		color: '#e74c3c',
	},
	errorBox: {
		backgroundColor: '#fdf0f0',
		border: '1px solid #f5c6cb',
		borderRadius: 8,
		padding: '10px 14px',
		color: '#c0392b',
		fontSize: 14,
		marginBottom: 16,
		display: 'flex',
		alignItems: 'center',
		gap: 8,
	},
	successBox: {
		backgroundColor: '#eafaf1',
		border: '1px solid #a9dfbf',
		borderRadius: 8,
		padding: '12px 14px',
		color: '#1e8449',
		fontSize: 14,
		marginBottom: 20,
		display: 'flex',
		alignItems: 'center',
		gap: 8,
	},
	materiasGrid: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		gap: 8,
		maxHeight: 240,
		overflowY: 'auto' as const,
		padding: '4px 2px',
	},
	footer: {
		marginTop: 16,
		textAlign: 'center',
	},
	linkBtn: {
		background: 'none',
		border: 'none',
		color: theme.colors.primary,
		fontSize: 14,
		cursor: 'pointer',
		fontFamily: "'Inter', sans-serif",
		textDecoration: 'underline',
		padding: 0,
	},
};
