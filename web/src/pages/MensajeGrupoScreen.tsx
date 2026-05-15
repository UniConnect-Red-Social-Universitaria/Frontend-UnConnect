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

	const [miembros, setMiembros] = useState<any[]>([]);
	const [mencionQuery, setMencionQuery] = useState<string | null>(null);
	const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

	useEffect(() => {
		if (grupoId && nombreGrupo === 'Cargando grupo...') {
			gruposService.getGrupo(grupoId)
				.then(g => setNombreGrupo(g.nombre))
				.catch(() => setNombreGrupo('Grupo'));
		}
		if (grupoId) {
			gruposService.getMiembros(grupoId).then(m => setMiembros(m)).catch(() => {});
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
		handleReaccionar,
	} = useChatGrupo({ grupoId: grupoId! });

	const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const text = e.target.value;
		setNuevoMensaje(text);
		
		const match = text.match(/@(\w*)$/);
		if (match) {
			setMencionQuery(match[1]);
		} else {
			setMencionQuery(null);
		}
	};

	const selectMencion = (username: string) => {
		setNuevoMensaje(prev => prev.replace(/@\w*$/, `@${username} `));
		setMencionQuery(null);
	};

	const miembrosFiltrados = miembros.filter(m => 
		mencionQuery !== null && m.nombre?.toLowerCase().startsWith(mencionQuery.toLowerCase())
	);

	if (!grupoId) return null;

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				.uc-chat-container { display: flex; flex-direction: column; height: calc(100vh - 120px); max-height: 800px; background: #fff; border-radius: 16px; border: 1px solid #e8eef4; box-shadow: 0 10px 30px rgba(0,62,112,0.08); overflow: hidden; margin-top: 10px; position: relative; }
				@media (max-width: 768px) { .uc-chat-container { height: calc(100vh - 150px); margin-top: 0; border-radius: 12px; border: none; box-shadow: none; } }
				.uc-msg-scroll { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: #f8fafc; }
				.uc-polls { display: flex; flex-direction: column; gap: 12px; margin-bottom: 4px; }
				.uc-msg { max-width: 75%; padding: 12px 16px; border-radius: 14px; position: relative; animation: fadeUp 0.2s ease; word-wrap: break-word; }
				.uc-msg.mine { align-self: flex-end; background: #003e70; color: #fff; border-bottom-right-radius: 4px; }
				.uc-msg.other { align-self: flex-start; background: #fff; color: #00284d; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
				.uc-msg-author { font-size: 12px; font-weight: 700; color: #003e70; margin-bottom: 4px; display: block; }
				.uc-msg-text { margin: 0; font-size: 14px; line-height: 1.4; font-family: 'Inter', sans-serif; }
				.uc-msg-time { font-size: 11px; margin-top: 6px; text-align: right; opacity: 0.8; }
				.uc-chat-input-area { padding: 16px; background: #fff; border-top: 1px solid #e8eef4; display: flex; gap: 12px; position: relative; }
				.uc-chat-input { flex: 1; padding: 12px 16px; border: 1.5px solid #c5d3df; border-radius: 24px; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
				.uc-chat-input:focus { border-color: #003e70; }
				.uc-btn-send { padding: 0 24px; background: #003e70; color: #fff; border: none; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
				.uc-btn-send:hover:not(:disabled) { background: #00284d; }
				.uc-btn-send:disabled { opacity: 0.6; cursor: not-allowed; }
				.reaction-picker { position: absolute; right: -30px; top: 10px; background: #fff; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); display: flex; gap: 4px; padding: 4px 8px; z-index: 10; border: 1px solid #e2e8f0; }
				.reaction-picker span { cursor: pointer; transition: transform 0.1s; }
				.reaction-picker span:hover { transform: scale(1.2); }
				.mention-popup { position: absolute; bottom: 70px; left: 16px; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e8eef4; z-index: 20; max-height: 200px; overflow-y: auto; width: 250px; }
				.mention-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
				.mention-item:hover { background: #f0f4f8; }
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
							
							const isMention = item.menciones?.some((m: any) => m.usuarioMencionadoId === userId);
							const borderStyle = isMention && !isMine ? { border: '2px solid #ffd700' } : {};

							return (
								<div 
									key={item.id} 
									className={`uc-msg ${isMine ? 'mine' : 'other'}`} 
									style={borderStyle} 
									onMouseEnter={() => setHoveredMsgId(item.id)}
									onMouseLeave={() => setHoveredMsgId(null)}
								>
									{!isMine && item.emisor && (
										<span className="uc-msg-author">{item.emisor.nombre} {item.emisor.apellido}</span>
									)}
									<p className="uc-msg-text">{item.contenido}</p>
									<div className="uc-msg-time">
										{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</div>
									{hoveredMsgId === item.id && (
										<div className="reaction-picker" style={isMine ? { right: 'auto', left: '-30px' } : {}}>
											<span onClick={() => handleReaccionar(item.id, '👍')}>👍</span>
											<span onClick={() => handleReaccionar(item.id, '❤️')}>❤️</span>
											<span onClick={() => handleReaccionar(item.id, '😂')}>😂</span>
										</div>
									)}
									{item.reacciones && item.reacciones.length > 0 && (
										<div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 4, gap: 4 }}>
											{Array.from(new Set(item.reacciones.map((r: any) => r.emoji))).map((emoji: any, index) => {
												const count = item.reacciones.filter((r: any) => r.emoji === emoji).length;
												const didIReact = item.reacciones.some((r: any) => r.emoji === emoji && r.usuarioId === userId);
												return (
													<span 
														key={index} 
														onClick={() => handleReaccionar(item.id, emoji)}
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
						{mencionQuery !== null && miembrosFiltrados.length > 0 && (
							<div className="mention-popup">
								{miembrosFiltrados.map((m: any) => (
									<div key={m.id} className="mention-item" onClick={() => selectMencion(m.nombre)}>
										<strong>{m.nombre}</strong> {m.apellido}
									</div>
								))}
							</div>
						)}
						<input
							className="uc-chat-input"
							value={nuevoMensaje}
							onChange={handleTextChange}
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