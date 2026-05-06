import { useNotifications } from '../context/NotificationsContext';
import type { ToastItem } from '../context/NotificationsContext';
import theme from '@uniconnect/theme';

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
	const bgColor =
		toast.type === 'error'
			? '#c0392b'
			: toast.type === 'success'
			? '#27ae60'
			: theme.colors.primary;

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 12,
				backgroundColor: bgColor,
				color: '#fff',
				padding: '12px 16px',
				borderRadius: 10,
				boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
				maxWidth: 360,
				animation: 'slideIn 0.25s ease',
				fontSize: 14,
				fontWeight: 500,
			}}
		>
			<span style={{ flex: 1 }}>{toast.message}</span>
			<button
				onClick={onDismiss}
				style={{
					background: 'none',
					border: 'none',
					color: '#fff',
					cursor: 'pointer',
					fontSize: 18,
					lineHeight: 1,
					padding: 0,
					opacity: 0.8,
				}}
				aria-label="Cerrar notificación"
			>
				×
			</button>
		</div>
	);
}

export default function ToastContainer() {
	const { toasts, dismissToast } = useNotifications();

	if (toasts.length === 0) return null;

	return (
		<>
			<style>{`
				@keyframes slideIn {
					from { transform: translateX(100%); opacity: 0; }
					to   { transform: translateX(0);   opacity: 1; }
				}
			`}</style>
			<div
				style={{
					position: 'fixed',
					bottom: 24,
					right: 24,
					zIndex: 9999,
					display: 'flex',
					flexDirection: 'column',
					gap: 10,
					pointerEvents: 'none',
				}}
			>
				{toasts.map((t) => (
					<div key={t.id} style={{ pointerEvents: 'auto' }}>
						<Toast toast={t} onDismiss={() => dismissToast(t.id)} />
					</div>
				))}
			</div>
		</>
	);
}
