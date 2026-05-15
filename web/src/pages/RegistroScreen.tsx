import { useNavigate } from 'react-router-dom';
import { useAuth0Web } from '../hooks/useAuth0Web';
import theme from '@uniconnect/theme';

export default function RegistroScreen() {
	const navigate = useNavigate();
	const { initiateLogin, loading, error } = useAuth0Web();
	const allowedDomain = import.meta.env.VITE_ALLOWED_DOMAIN || 'ucaldas.edu.co';

	return (
		<div style={s.screen}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				body { margin: 0; }
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
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 10px;
				}
				.uc-btn-primary:hover:not(:disabled) { background: #00284d; }
				.uc-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
				.error-text {
					margin: 0 0 16px 0;
					font-size: 14px;
					color: #e74c3c;
					text-align: center;
					font-weight: 500;
				}
				@keyframes fadeUp {
					from { opacity: 0; transform: translateY(20px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				@keyframes spin { to { transform: rotate(360deg); } }
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
							alt="Logo Universidad de Caldas"
							style={s.logo}
							onError={(e) => {
								(e.target as HTMLImageElement).style.display = 'none';
							}}
						/>
					</div>

					<h2 style={s.title}>Registro Institucional</h2>
					<p style={s.subtitle}>
						Para unirte a UniConnect, utiliza tu correo institucional de la Universidad de
						Caldas{' '}
						<strong style={{ color: theme.colors.primaryDark }}>
							(@{allowedDomain})
						</strong>
					</p>

					{/* Info box */}
					<div style={s.infoBox}>
						<span style={{ fontSize: 20 }}>🏛️</span>
						<div>
							<p style={s.infoTitle}>Acceso exclusivo para estudiantes</p>
							<p style={s.infoDesc}>
								Solo se admiten cuentas con correo <strong>@{allowedDomain}</strong>.
								Serás redirigido a Auth0 para autenticarte con tu cuenta institucional de
								Google. Después completarás tu perfil académico.
							</p>
						</div>
					</div>

					{error && <p className="error-text">{error}</p>}

					<button
						className="uc-btn-primary"
						onClick={initiateLogin}
						disabled={loading}
					>
						{loading ? (
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
							<>
								<span style={{ fontSize: 18 }}>🔐</span>
								Continuar con cuenta institucional
							</>
						)}
					</button>

					{/* Volver */}
					<div style={s.footer}>
						<button style={s.linkBtn} onClick={() => navigate('/')}>
							← Volver al inicio
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
		maxWidth: 480,
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
		margin: '0 0 8px',
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
		lineHeight: 1.6,
	},
	infoBox: {
		display: 'flex',
		gap: 14,
		backgroundColor: theme.colors.goldLight,
		borderRadius: 12,
		padding: '16px',
		marginBottom: 24,
		alignItems: 'flex-start',
	},
	infoTitle: {
		margin: '0 0 4px',
		fontSize: 14,
		fontWeight: 700,
		color: theme.colors.primaryDark,
	},
	infoDesc: {
		margin: 0,
		fontSize: 13,
		color: theme.colors.primaryMid,
		lineHeight: 1.5,
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
