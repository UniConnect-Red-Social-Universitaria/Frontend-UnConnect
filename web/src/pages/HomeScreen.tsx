import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import theme from '@uniconnect/theme';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useAuth();

	// Si ya está logueado, redirigir al principal
	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			navigate('/principal', { replace: true });
		}
	}, [isAuthenticated, isLoading, navigate]);

	return (
		<div style={styles.screen}>
			{/* ── Header ── */}
			<header style={styles.header}>
				<h1 style={styles.headerTitle}>UniConnect</h1>
				<img
					src="/logo-caldas.png"
					alt="Logo Universidad de Caldas"
					style={styles.headerLogo}
					onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
				/>
			</header>

			{/* ── Main content ── */}
			<main style={styles.main}>
				<div style={styles.card}>
					{/* Logo central (mobile) */}
					<div style={styles.logoWrap}>
						<img
							src="/logo-caldas.png"
							alt="UniConnect"
							style={styles.logoCentral}
							onError={(e) => {
								const el = e.target as HTMLImageElement;
								el.style.display = 'none';
							}}
						/>
					</div>

					<h2 style={styles.cardTitle}>Bienvenido a UniConnect</h2>
					<p style={styles.cardSubtitle}>
						Plataforma de conexión universitaria para estudiantes de la
						Universidad de Caldas
					</p>

					<div style={styles.featuresGrid}>
						{[
							{ icon: '👥', label: 'Grupos de estudio' },
							{ icon: '📅', label: 'Eventos académicos' },
							{ icon: '💬', label: 'Mensajes directos' },
							{ icon: '🔔', label: 'Notificaciones' },
						].map((f) => (
							<div key={f.label} style={styles.featureItem}>
								<span style={styles.featureIcon}>{f.icon}</span>
								<span style={styles.featureLabel}>{f.label}</span>
							</div>
						))}
					</div>

					<div style={styles.buttonsRow}>
						<button
							id="btn-registro"
							style={{ ...styles.btn, ...styles.btnPrimary }}
							onClick={() => navigate('/registro')}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLButtonElement).style.backgroundColor =
									theme.colors.primaryDark;
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLButtonElement).style.backgroundColor =
									theme.colors.primary;
							}}
						>
							Registrarse
						</button>
						<button
							id="btn-login"
							style={{ ...styles.btn, ...styles.btnSecondary }}
							onClick={() => navigate('/login')}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLButtonElement).style.backgroundColor =
									theme.colors.goldDark;
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLButtonElement).style.backgroundColor =
									theme.colors.gold;
							}}
						>
							Iniciar sesión
						</button>
					</div>
				</div>
			</main>

			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				body { margin: 0; font-family: 'Inter', sans-serif; }
				@keyframes fadeUp {
					from { opacity: 0; transform: translateY(24px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				.hero-card { animation: fadeUp 0.5s ease both; }
			`}</style>
		</div>
	);
}

const styles: Record<string, React.CSSProperties> = {
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
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerTitle: {
		margin: 0,
		color: theme.colors.gold,
		fontSize: 22,
		fontWeight: 700,
		letterSpacing: 0.5,
	},
	headerLogo: {
		width: 40,
		height: 40,
		objectFit: 'contain',
	},
	main: {
		flex: 1,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '32px 16px',
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		boxShadow: '0 8px 32px rgba(0,62,112,0.12)',
		padding: '40px 32px',
		maxWidth: 520,
		width: '100%',
		animation: 'fadeUp 0.5s ease both',
	},
	logoWrap: {
		display: 'flex',
		justifyContent: 'center',
		marginBottom: 20,
	},
	logoCentral: {
		width: 96,
		height: 96,
		objectFit: 'contain',
	},
	cardTitle: {
		margin: '0 0 8px',
		color: theme.colors.primaryDark,
		fontSize: 24,
		fontWeight: 700,
		textAlign: 'center',
	},
	cardSubtitle: {
		margin: '0 0 28px',
		color: theme.colors.primaryMid,
		fontSize: 15,
		textAlign: 'center',
		lineHeight: 1.5,
	},
	featuresGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: 12,
		marginBottom: 32,
	},
	featureItem: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		backgroundColor: theme.colors.goldLight,
		borderRadius: 10,
		padding: '10px 14px',
	},
	featureIcon: {
		fontSize: 20,
	},
	featureLabel: {
		fontSize: 13,
		fontWeight: 600,
		color: theme.colors.primaryDark,
	},
	buttonsRow: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: 12,
	},
	btn: {
		width: '100%',
		padding: '14px 24px',
		borderRadius: 10,
		border: 'none',
		fontSize: 16,
		fontWeight: 600,
		cursor: 'pointer',
		transition: 'background-color 0.2s, transform 0.1s',
		fontFamily: "'Inter', sans-serif",
	},
	btnPrimary: {
		backgroundColor: theme.colors.primary,
		color: '#fff',
	},
	btnSecondary: {
		backgroundColor: theme.colors.gold,
		color: theme.colors.primaryDark,
	},
};