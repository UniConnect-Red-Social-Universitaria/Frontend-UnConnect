import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useChatDirecto } from '../hooks/useChatDirecto';
import { clearUnreadDirectChatNotification } from '../services/notificaciones-chat.service';
import { usuariosService } from '../services/usuarios.service';

export default function MensajeDirectoScreen() {
	const { contactoId } = useParams<{ contactoId: string }>();
	const location = useLocation();
	
	const [contactoInfo, setContactoInfo] = useState<{ nombre: string; correo: string } | null>(
		location.state as any || null
	);
	const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

	useEffect(() => {
		if (contactoId) clearUnreadDirectChatNotification(contactoId);
	}, [contactoId]);

	useEffect(() => {
		if (!contactoInfo && contactoId) {
			usuariosService.getCompaneros().then(comps => {
				const c = comps.find((x: any) => x.id === contactoId);
				if (c) setContactoInfo({ nombre: c.nombre, correo: c.correo });
				else setContactoInfo({ nombre: 'Usuario', correo: '...' });
			}).catch(() => setContactoInfo({ nombre: 'Usuario', correo: '...' }));
		}
	}, [contactoId, contactoInfo]);

	const {
		mensajes, nuevoMensaje, setNuevoMensaje,
		enviando, error, userId, scrollRef, handleEnviarMensaje, handleReaccionar
	} = useChatDirecto({ contactoId: contactoId! });

	if (!contactoId) return null;

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				.uc-chat-container { display: flex; flex-direction: column; height: calc(100vh - 120px); max-height: 800px; background: #fff; border-radius: 16px; border: 1px solid #e8eef4; box-shadow: 0 10px 30px rgba(0,62,112,0.08); overflow: hidden; margin-top: 10px; }
				@media (max-width: 768px) { .uc-chat-container { height: calc(100vh - 150px); margin-top: 0; border-radius: 12px; border: none; box-shadow: none; } }
				.uc-msg-scroll { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: #f8fafc; }
				.uc-msg { max-width: 75%; padding: 12px 16px; border-radius: 14px; position: relative; animation: fadeUp 0.2s ease; word-wrap: break-word; }
				.uc-msg.mine { align-self: flex-end; background: #003e70; color: #fff; border-bottom-right-radius: 4px; }
				.uc-msg.other { align-self: flex-start; background: #fff; color: #00284d; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
				.uc-msg-text { margin: 0; font-size: 14px; line-height: 1.4; font-family: 'Inter', sans-serif; }
				.uc-msg-time { font-size: 11px; margin-top: 6px; text-align: right; opacity: 0.8; }
				.uc-chat-input-area { padding: 16px; background: #fff; border-top: 1px solid #e8eef4; display: flex; gap: 12px; }
				.uc-chat-input { flex: 1; padding: 12px 16px; border: 1.5px solid #c5d3df; border-radius: 24px; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
				.uc-chat-input:focus { border-color: #003e70; }
				.uc-btn-send { padding: 0 24px; background: #003e70; color: #fff; border: none; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
				.uc-btn-send:hover:not(:disabled) { background: #00284d; }
				.uc-btn-send:disabled { opacity: 0.6; cursor: not-allowed; }
				.reaction-picker { position: absolute; right: -30px; top: 10px; background: #fff; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); display: flex; gap: 4px; padding: 4px 8px; z-index: 10; border: 1px solid #e2e8f0; }
				.reaction-picker span { cursor: pointer; transition: transform 0.1s; }
				.reaction-picker span:hover { transform: scale(1.2); }
				@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
			`}</style>

			<div style={s.content}>
				<div style={s.headerRow}>
					<div>
						<h1 style={s.pageTitle}>{contactoInfo?.nombre || 'Cargando...'}</h1>
						<p style={s.pageSubtitle}>{contactoInfo?.correo}</p>
					</div>
				</div>

				<div className="uc-chat-container">
					<div className="uc-msg-scroll" ref={scrollRef}>
						{mensajes.map(m => {
							const isMine = m.emisorId === userId;

							const isMention = m.menciones?.some((ment: any) => ment.usuarioMencionadoId === userId);
							const borderStyle = isMention && !isMine ? { border: '2px solid #ffd700' } : {};

							return (
								<div 
									key={m.id} 
									className={`uc-msg ${isMine ? 'mine' : 'other'}`} 
									style={borderStyle}
									onMouseEnter={() => setHoveredMsgId(m.id)}
									onMouseLeave={() => setHoveredMsgId(null)}
								>
									<p className="uc-msg-text">{m.contenido}</p>
									<div className="uc-msg-time">
										{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</div>
									{hoveredMsgId === m.id && (
										<div className="reaction-picker" style={isMine ? { right: 'auto', left: '-30px' } : {}}>
											<span onClick={() => handleReaccionar(m.id, '👍')}>👍</span>
											<span onClick={() => handleReaccionar(m.id, '❤️')}>❤️</span>
											<span onClick={() => handleReaccionar(m.id, '😂')}>😂</span>
										</div>
									)}
									{m.reacciones && m.reacciones.length > 0 && (
										<div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 4, gap: 4 }}>
											{Array.from(new Set(m.reacciones.map((r: any) => r.emoji))).map((emoji: any, index) => {
												const count = m.reacciones.filter((r: any) => r.emoji === emoji).length;
												const didIReact = m.reacciones.some((r: any) => r.emoji === emoji && r.usuarioId === userId);
												return (
													<span 
														key={index} 
														onClick={() => handleReaccionar(m.id, emoji)}
														style={{ 
															cursor: 'pointer', 
															fontSize: 12, 
															backgroundColor: didIReact ? 'rgba(0,40,85,0.2)' : 'rgba(255,255,255,0.2)', 
															padding: '2px 6px', 
															borderRadius: 10,
															display: 'inline-flex',
															alignItems: 'center',
															gap: 2
														}}>
														<span>{emoji}</span>
														{count > 1 && <span>{count}</span>}
													</span>
												);
											})}
										</div>
									)}
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
							placeholder="Escribe un mensaje..."
							onKeyDown={e => e.key === 'Enter' && handleEnviarMensaje()}
							disabled={enviando}
						/>
						<button className="uc-btn-send" onClick={handleEnviarMensaje} disabled={enviando || !nuevoMensaje.trim()}>
							{enviando ? '...' : 'Enviar'}
						</button>
					</div>
				</div>
			</div>
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