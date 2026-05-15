import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

type NavItem = {
	path: string;
	label: string;
	icon: string;
	activeIcon: string;
};

const NAV_ITEMS: NavItem[] = [
	{ path: '/principal',    label: 'Inicio',         icon: '🏠', activeIcon: '🏠' },
	{ path: '/grupos',       label: 'Grupos',         icon: '👥', activeIcon: '👥' },
	{ path: '/eventos',      label: 'Eventos',        icon: '📅', activeIcon: '📅' },
	{ path: '/contactos',    label: 'Contactos',      icon: '💬', activeIcon: '💬' },
	{ path: '/solicitudes',  label: 'Solicitudes',    icon: '📨', activeIcon: '📨' },
	{ path: '/notificaciones', label: 'Notificaciones', icon: '🔔', activeIcon: '🔔' },
	{ path: '/sesiones',      label: 'Sesiones',       icon: '📚', activeIcon: '📚' },
	{ path: '/editar-perfil',label: 'Perfil',         icon: '👤', activeIcon: '👤' },
];

export default function AppLayout() {
	const navigate = useNavigate();
	const { onLogout } = useAuth();
	const { unreadCount } = useNotifications();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleLogout = async () => {
		await onLogout();
		navigate('/login', { replace: true });
	};

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; margin: 0; padding: 0; }
				body { font-family: 'Inter', sans-serif; background: #f0f4f8; }

				/* ── Sidebar ── */
				.uc-sidebar {
					position: fixed;
					top: 0; left: 0; bottom: 0;
					width: 220px;
					background: #fff;
					border-right: 1.5px solid #dce6ef;
					display: flex;
					flex-direction: column;
					z-index: 200;
					transition: transform 0.25s ease;
				}
				.uc-sidebar-header {
					padding: 24px 20px 16px;
					border-bottom: 1px solid #eef2f6;
					display: flex;
					align-items: center;
					gap: 10px;
				}
				.uc-sidebar-logo {
					width: 36px;
					height: 36px;
					object-fit: contain;
				}
				.uc-sidebar-brand {
					font-size: 17px;
					font-weight: 700;
					color: #003e70;
				}
				.uc-nav {
					flex: 1;
					padding: 12px 0;
					overflow-y: auto;
				}
				.uc-nav-item {
					display: flex;
					align-items: center;
					gap: 12px;
					padding: 11px 20px;
					font-size: 14px;
					font-weight: 500;
					color: #4a6a85;
					text-decoration: none;
					border-left: 3px solid transparent;
					transition: all 0.15s;
					position: relative;
				}
				.uc-nav-item:hover {
					background: #f0f4f8;
					color: #003e70;
				}
				.uc-nav-item.active {
					background: #e8f0f8;
					color: #003e70;
					border-left-color: #003e70;
					font-weight: 600;
				}
				.uc-nav-icon { font-size: 18px; min-width: 22px; text-align: center; }
				.uc-badge {
					margin-left: auto;
					background: #e74c3c;
					color: #fff;
					font-size: 11px;
					font-weight: 700;
					padding: 1px 6px;
					border-radius: 10px;
					min-width: 18px;
					text-align: center;
				}
				.uc-sidebar-footer {
					padding: 16px 20px;
					border-top: 1px solid #eef2f6;
				}
				.uc-logout-btn {
					width: 100%;
					padding: 10px;
					background: #003e70;
					color: #fff;
					border: none;
					border-radius: 8px;
					font-size: 14px;
					font-weight: 600;
					cursor: pointer;
					font-family: 'Inter', sans-serif;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					transition: background 0.2s;
				}
				.uc-logout-btn:hover { background: #00284d; }

				/* ── Main content ── */
				.uc-main {
					margin-left: 220px;
					min-height: 100dvh;
					display: flex;
					flex-direction: column;
				}

				/* ── Mobile header ── */
				.uc-mobile-header {
					display: none;
					align-items: center;
					justify-content: space-between;
					background: #003e70;
					border-bottom: 3px solid #c5952a;
					padding: 12px 16px;
					position: sticky;
					top: 0;
					z-index: 100;
				}
				.uc-mobile-title {
					color: #c5952a;
					font-size: 18px;
					font-weight: 700;
				}
				.uc-hamburger {
					background: none;
					border: none;
					color: #fff;
					font-size: 24px;
					cursor: pointer;
					padding: 4px;
					line-height: 1;
				}

				/* ── Mobile drawer overlay ── */
				.uc-drawer-overlay {
					display: none;
					position: fixed;
					inset: 0;
					background: rgba(0,0,0,0.4);
					z-index: 190;
				}



				/* ── Responsive ── */
				@media (max-width: 768px) {
					.uc-sidebar {
						transform: translateX(-100%);
					}
					.uc-sidebar.open {
						transform: translateX(0);
					}
					.uc-drawer-overlay.open {
						display: block;
					}
					.uc-main {
						margin-left: 0;
					}
					.uc-mobile-header {
						display: flex;
					}
				}
			`}</style>

			{/* ── Sidebar ── */}
			<nav className={`uc-sidebar${mobileMenuOpen ? ' open' : ''}`}>
				<div className="uc-sidebar-header">
					<img
						src="/logo-caldas.png"
						alt="Logo"
						className="uc-sidebar-logo"
						onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
					/>
					<span className="uc-sidebar-brand">UniConnect</span>
				</div>

				<div className="uc-nav">
					{NAV_ITEMS.map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							end={item.path === '/principal'}
							className={({ isActive }) => `uc-nav-item${isActive ? ' active' : ''}`}
							onClick={() => setMobileMenuOpen(false)}
						>
							<span className="uc-nav-icon">{item.icon}</span>
							<span>{item.label}</span>
							{item.path === '/notificaciones' && unreadCount > 0 && (
								<span className="uc-badge">
									{unreadCount > 99 ? '99+' : unreadCount}
								</span>
							)}
						</NavLink>
					))}
				</div>

				<div className="uc-sidebar-footer">
					<button className="uc-logout-btn" onClick={handleLogout}>
						<span>🚪</span> Salir
					</button>
				</div>
			</nav>

			{/* ── Drawer overlay (mobile) ── */}
			<div
				className={`uc-drawer-overlay${mobileMenuOpen ? ' open' : ''}`}
				onClick={() => setMobileMenuOpen(false)}
			/>

			{/* ── Main area ── */}
			<div className="uc-main">
				{/* Mobile header */}
				<header className="uc-mobile-header">
					<span className="uc-mobile-title">UniConnect</span>
					<button
						className="uc-hamburger"
						onClick={() => setMobileMenuOpen((o) => !o)}
						aria-label="Abrir menú"
					>
						{mobileMenuOpen ? '✕' : '☰'}
					</button>
				</header>

				{/* Page content */}
				<div style={{ flex: 1 }}>
					<Outlet />
				</div>
			</div>


		</>
	);
}
