import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import theme from '@uniconnect/theme';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
	const navigate = useNavigate();
	const location = useLocation();
	const { onLoginSuccess } = useAuth();

	const [correo, setCorreo] = useState('');
	const [contrasena, setContrasena] = useState('');
	const [estaCargando, setEstaCargando] = useState(false);
	const [errorGeneral, setErrorGeneral] = useState('');
	const [errores, setErrores] = useState({ correo: '', contrasena: '' });

	const from = (location.state as any)?.from?.pathname || '/principal';

	const validarFormulario = () => {
		const nuevosErrores = { correo: '', contrasena: '' };
		let esValido = true;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!correo.trim() || !emailRegex.test(correo)) {
			nuevosErrores.correo = 'Ingresa un correo válido.';
			esValido = false;
		}
		if (contrasena.trim().length === 0) {
			nuevosErrores.contrasena = 'La contraseña es obligatoria.';
			esValido = false;
		}

		setErrores(nuevosErrores);
		return esValido;
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorGeneral('');

		if (!validarFormulario()) return;

		setEstaCargando(true);
		try {
			await authService.login(correo.trim(), contrasena);
			await onLoginSuccess();
			navigate(from, { replace: true });
		} catch (error: any) {
			const mensaje = error.message || 'Correo o contraseña incorrectos, intenta de nuevo.';
			setErrorGeneral(mensaje);
		} finally {
			setEstaCargando(false);
		}
	};

	return (
		<div style={s.screen}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				body { margin: 0; }
				.uc-input {
					width: 100%;
					padding: 12px 14px;
					border: 1.5px solid #c5d3df;
					border-radius: 8px;
					font-size: 15px;
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
					{/* Logo */}
					<div style={s.logoWrap}>
						<img
							src="/logo-caldas.png"
							alt="Logo"
							style={s.logo}
							onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
						/>
					</div>

					<h2 style={s.title}>Bienvenido de nuevo</h2>
					<p style={s.subtitle}>Inicia sesión para continuar en UniConnect</p>

					<form onSubmit={handleLogin} noValidate>
						{/* Correo */}
						<div style={s.inputGroup}>
							<label style={s.label} htmlFor="correo">
								Correo electrónico
							</label>
							<input
								id="correo"
								type="email"
								className={`uc-input${errores.correo ? ' error' : ''}`}
								placeholder="ejemplo@ucaldas.edu.co"
								value={correo}
								onChange={(e) => {
									setCorreo(e.target.value);
									setErrores({ ...errores, correo: '' });
									setErrorGeneral('');
								}}
								disabled={estaCargando}
								autoComplete="email"
							/>
							{errores.correo && <p style={s.errorText}>{errores.correo}</p>}
						</div>

						{/* Contraseña */}
						<div style={s.inputGroup}>
							<label style={s.label} htmlFor="contrasena">
								Contraseña
							</label>
							<input
								id="contrasena"
								type="password"
								className={`uc-input${errores.contrasena ? ' error' : ''}`}
								placeholder="Ingresa tu contraseña"
								value={contrasena}
								onChange={(e) => {
									setContrasena(e.target.value);
									setErrores({ ...errores, contrasena: '' });
									setErrorGeneral('');
								}}
								disabled={estaCargando}
								autoComplete="current-password"
							/>
							{errores.contrasena && <p style={s.errorText}>{errores.contrasena}</p>}
						</div>

						{/* Error general */}
						{errorGeneral && (
							<div style={s.errorBox}>
								<span>⚠️</span> {errorGeneral}
							</div>
						)}

						{/* Botón login */}
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
								'Iniciar Sesión'
							)}
						</button>
					</form>

					{/* Registro link */}
					<div style={s.footer}>
						<button
							style={s.linkBtn}
							onClick={() => navigate('/registro')}
							disabled={estaCargando}
						>
							¿No tienes una cuenta? Regístrate aquí
						</button>
					</div>
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
		padding: '40px 32px',
		maxWidth: 440,
		width: '100%',
		animation: 'fadeUp 0.45s ease both',
	},
	logoWrap: {
		display: 'flex',
		justifyContent: 'center',
		marginBottom: 20,
	},
	logo: {
		width: 80,
		height: 80,
		objectFit: 'contain',
	},
	title: {
		margin: '0 0 6px',
		fontSize: 22,
		fontWeight: 700,
		color: theme.colors.primaryDark,
		textAlign: 'center',
	},
	subtitle: {
		margin: '0 0 28px',
		fontSize: 14,
		color: theme.colors.primaryMid,
		textAlign: 'center',
	},
	inputGroup: {
		marginBottom: 18,
	},
	label: {
		display: 'block',
		marginBottom: 6,
		fontSize: 14,
		fontWeight: 600,
		color: theme.colors.primaryDark,
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
	footer: {
		marginTop: 20,
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