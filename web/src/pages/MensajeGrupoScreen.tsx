import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { PollCard, PollCreateModal, SecondaryButton } from '@uniconnect/ui';
import { useChatGrupo } from '../hooks/useChatGrupo';
import { clearUnreadGroupChatNotification } from '../services/notificaciones-chat.service';
import { gruposService } from '../services/grupos.service';

export default function MensajeGrupoScreen() {
	const { grupoId } = useParams<{ grupoId: string }>();
	const location = useLocation();
	const navigate = useNavigate();
	const [mostrarCrearEncuesta, setMostrarCrearEncuesta] = useState(false);
	
	const [nombreGrupo, setNombreGrupo] = useState<string>(
		(location.state as any)?.nombreGrupo || 'Cargando grupo...'
	);

	useEffect(() => {
		if (grupoId) clearUnreadGroupChatNotification(grupoId);
	}, [grupoId]);

	useEffect(() => {
		if (grupoId && nombreGrupo === 'Cargando grupo...') {
			gruposService.getGrupo(grupoId)
				.then(g => setNombreGrupo(g.nombre))
				.catch(() => setNombreGrupo('Grupo'));
		}
	}, [grupoId, nombreGrupo]);

	const {
		items,
		nuevoMensaje,
		setNuevoMensaje,
		enviando,
		error,
		userId,
		scrollRef,
		handleEnviarMensaje,
		handleVotarEncuesta,
		votandoEncuestaId,
		handleCrearEncuesta,
	} = useChatGrupo({ grupoId: grupoId! });

	if (!grupoId) return null;

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				.uc-chat-container { display: flex; flex-direction: column; height: calc(100vh - 120px); max-height: 800px; background: #fff; border-radius: 16px; border: 1px solid #e8eef4; box-shadow: 0 10px 30px rgba(0,62,112,0.08); overflow: hidden; margin-top: 10px; }
				@media (max-width: 768px) { .uc-chat-container { height: calc(100vh - 150px); margin-top: 0; border-radius: 12px; border: none; box-shadow: none; } }
				.uc-msg-scroll { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: #f8fafc; }
				.uc-polls { display: flex; flex-direction: column; gap: 12px; margin-bottom: 4px; }
				.uc-msg { max-width: 75%; padding: 12px 16px; border-radius: 14px; position: relative; animation: fadeUp 0.2s ease; word-wrap: break-word; }
				.uc-msg.mine { align-self: flex-end; background: #003e70; color: #fff; border-bottom-right-radius: 4px; }
				.uc-msg.other { align-self: flex-start; background: #fff; color: #00284d; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
				.uc-msg-author { font-size: 12px; font-weight: 700; color: #003e70; margin-bottom: 4px; display: block; }
				.uc-msg-text { margin: 0; font-size: 14px; line-height: 1.4; font-family: 'Inter', sans-serif; }
				.uc-msg-time { font-size: 11px; margin-top: 6px; text-align: right; opacity: 0.8; }
				.uc-chat-input-area { padding: 16px; background: #fff; border-top: 1px solid #e8eef4; display: flex; gap: 12px; }
				.uc-chat-input { flex: 1; padding: 12px 16px; border: 1.5px solid #c5d3df; border-radius: 24px; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
				.uc-chat-input:focus { border-color: #003e70; }
				.uc-btn-send { padding: 0 24px; background: #003e70; color: #fff; border: none; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
				.uc-btn-send:hover:not(:disabled) { background: #00284d; }
				.uc-btn-send:disabled { opacity: 0.6; cursor: not-allowed; }
				@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
			`}</style>

			<div style={s.content}>
				<div style={s.headerRow}>
					<div
						style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
						onClick={() => navigate(`/grupos/${grupoId}`)}
						title="Ver detalles del grupo"
					>
						<h1 style={s.pageTitle}>{nombreGrupo}</h1>
						<p style={s.pageSubtitle}>Chat de Grupo • Toca para ver detalles</p>
					</div>
					<SecondaryButton title="Nueva encuesta" onPress={() => setMostrarCrearEncuesta(true)} />
				</div>

				<div className="uc-chat-container">
					<div className="uc-msg-scroll" ref={scrollRef}>
						{items.map((item) => {
							if (item._type === 'encuesta') {
								return (
									<PollCard
										key={item.id}
										encuesta={item}
										onVote={handleVotarEncuesta}
										voting={votandoEncuestaId === item.id}
									/>
								);
							}
							const isMine = item.emisorId === userId;
							return (
								<div key={item.id} className={`uc-msg ${isMine ? 'mine' : 'other'}`}>
									{!isMine && item.emisor && (
										<span className="uc-msg-author">{item.emisor.nombre} {item.emisor.apellido}</span>
									)}
									<p className="uc-msg-text">{item.contenido}</p>
									<div className="uc-msg-time">
										{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</div>
								</div>
							);
						})}
					</div>
					
					{error && <div style={{ color: '#e74c3c', fontSize: 13, textAlign: 'center', padding: '8px', background: '#fdf0f0' }}>{error}</div>}
					
					<div className="uc-chat-input-area">
						<input
							className="uc-chat-input"
							value={nuevoMensaje}
							onChange={e => setNuevoMensaje(e.target.value)}
							placeholder="Escribe al grupo..."
							onKeyDown={e => e.key === 'Enter' && handleEnviarMensaje()}
							disabled={enviando}
						/>
						<button className="uc-btn-send" onClick={handleEnviarMensaje} disabled={enviando || !nuevoMensaje.trim()}>
							{enviando ? '...' : 'Enviar'}
						</button>
					</div>
				</div>
			</div>

			<PollCreateModal
				visible={mostrarCrearEncuesta}
				title="Crear encuesta en el grupo"
				subtitle={`La encuesta se publicará en ${nombreGrupo}.`}
				onClose={() => setMostrarCrearEncuesta(false)}
				onSubmit={async (payload) => {
					await handleCrearEncuesta(payload);
				}}
			/>
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	page: { minHeight: '100%', backgroundColor: '#f0f4f8', fontFamily: "'Inter', sans-serif" },
	content: { maxWidth: 800, margin: '0 auto', padding: '24px 20px 48px' },
	headerRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 },
	pageTitle: { margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: '#00284d' },
	pageSubtitle: { margin: 0, fontSize: 13, color: '#7a9ab5' },
};