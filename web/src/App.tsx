import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';
import AppLayout from './components/AppLayout';

// Carga lazy de todas las páginas para mejor performance
const HomeScreen = lazy(() => import('./pages/HomeScreen'));
const LoginScreen = lazy(() => import('./pages/LoginScreen'));
const RegistroScreen = lazy(() => import('./pages/RegistroScreen'));
const CompletarRegistroScreen = lazy(() => import('./pages/CompletarRegistroScreen'));
const PrincipalScreen = lazy(() => import('./pages/PrincipalScreen'));
const GruposScreen = lazy(() => import('./pages/GruposScreen'));
const EventosScreen = lazy(() => import('./pages/EventosScreen'));
const ContactScreen = lazy(() => import('./pages/ContactScreen'));
const SolicitudesScreen = lazy(() => import('./pages/SolicitudesScreen'));
const EditarPerfilScreen = lazy(() => import('./pages/EditarPerfilScreen'));
const NotificacionesScreen = lazy(() => import('./pages/NotificacionesScreen'));
const SolicitudesGrupoScreen = lazy(() => import('./pages/SolicitudesGrupoScreen'));
const DetalleGrupoScreen = lazy(() => import('./pages/DetalleGrupoScreen'));
const MensajeDirectoScreen = lazy(() => import('./pages/MensajeDirectoScreen'));
const MensajeGrupoScreen = lazy(() => import('./pages/MensajeGrupoScreen'));
const ForoScreen = lazy(() => import('./pages/ForoScreen'));
const SesionesEstudioScreen = lazy(() => import('./pages/SesionesEstudioScreen'));
const PerfilEstudianteScreen = lazy(() => import('./pages/PerfilEstudianteScreen'));

function PageLoader() {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100dvh',
				backgroundColor: '#ffffff',
			}}
		>
			<div
				style={{
					width: 40,
					height: 40,
					border: '4px solid #003e70',
					borderTopColor: 'transparent',
					borderRadius: '50%',
					animation: 'spin 0.8s linear infinite',
				}}
			/>
			<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
		</div>
	);
}

function AppRoutes() {
	return (
		<Suspense fallback={<PageLoader />}>
			<Routes>
				{/* ── Rutas públicas ── */}
				<Route path="/" element={<HomeScreen />} />
				<Route path="/login" element={<LoginScreen />} />
				<Route path="/registro" element={<RegistroScreen />} />
				<Route path="/completar-registro" element={<CompletarRegistroScreen />} />

				{/* ── Rutas protegidas (con AppLayout/sidebar) ── */}
				<Route
					element={
						<ProtectedRoute>
							<AppLayout />
						</ProtectedRoute>
					}
				>
					<Route path="/principal" element={<PrincipalScreen />} />
					<Route path="/grupos" element={<GruposScreen />} />
					<Route path="/grupos/:grupoId" element={<DetalleGrupoScreen />} />
					<Route path="/eventos" element={<EventosScreen />} />
					<Route path="/contactos" element={<ContactScreen />} />
					<Route path="/solicitudes" element={<SolicitudesScreen />} />
					<Route path="/editar-perfil" element={<EditarPerfilScreen />} />
					<Route path="/notificaciones" element={<NotificacionesScreen />} />
					<Route path="/solicitudes-grupo" element={<SolicitudesGrupoScreen />} />
					<Route path="/mensajes/directo/:contactoId" element={<MensajeDirectoScreen />} />
					<Route path="/mensajes/grupo/:grupoId" element={<MensajeGrupoScreen />} />
					<Route path="/foro/:materiaId" element={<ForoScreen />} />
					<Route path="/sesiones" element={<SesionesEstudioScreen />} />
					<Route path="/perfil/:id" element={<PerfilEstudianteScreen />} />
				</Route>

				{/* Fallback */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Suspense>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<NotificationsProvider>
					<AppRoutes />
					<ToastContainer />
				</NotificationsProvider>
			</AuthProvider>
		</BrowserRouter>
	);
}
