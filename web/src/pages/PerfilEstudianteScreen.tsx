import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usuariosService } from '../services/usuarios.service';
import type { PerfilEnriquecido, Insignia } from '../types/api.types';

const INSIGNIA_INFO: Record<Insignia, { emoji: string; label: string; desc: string; color: string }> = {
	'fundador': { emoji: '🏆', label: 'Fundador', desc: 'Ha creado grupos de estudio', color: '#f59e0b' },
	'participante-activo': { emoji: '⭐', label: 'Participante Activo', desc: 'Participa en 3 o más grupos', color: '#3b82f6' },
	'comunicador': { emoji: '💬', label: 'Comunicador', desc: 'Ha enviado 10 o más mensajes', color: '#10b981' },
	'colaborador': { emoji: '🤝', label: 'Colaborador', desc: 'Activo en grupos y mensajes', color: '#8b5cf6' },
};

const CSS = `
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
	* { box-sizing: border-box; }
	.pe-page { min-height: 100%; background: #f0f4f8; font-family: 'Inter', sans-serif; }
	.pe-content { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
	.pe-back { display: flex; align-items: center; gap: 8px; color: #003e70; font-size: 14px; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 24px; }
	.pe-back:hover { color: #00529a; }
	.pe-card { background: #fff; border-radius: 16px; border: 1px solid #e8eef4; box-shadow: 0 8px 24px rgba(0,62,112,0.06); overflow: hidden; }
	.pe-hero { background: linear-gradient(135deg, #003e70 0%, #00529a 100%); padding: 32px 28px; display: flex; align-items: center; gap: 20px; }
	.pe-avatar { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #fff; flex-shrink: 0; border: 3px solid rgba(255,255,255,0.4); }
	.pe-hero-info { flex: 1; min-width: 0; }
	.pe-name { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 4px; }
	.pe-carrera { font-size: 14px; color: rgba(255,255,255,0.8); margin: 0 0 4px; }
	.pe-semestre { font-size: 13px; color: rgba(255,255,255,0.65); margin: 0; }
	.pe-body { padding: 24px 28px; }
	.pe-section { margin-bottom: 28px; }
	.pe-section:last-child { margin-bottom: 0; }
	.pe-section-title { font-size: 13px; font-weight: 700; color: #7a9ab5; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 14px; }
	.pe-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
	.pe-stat { background: #f8fafc; border: 1px solid #e8eef4; border-radius: 12px; padding: 16px 12px; text-align: center; }
	.pe-stat-num { font-size: 28px; font-weight: 700; color: #003e70; line-height: 1; }
	.pe-stat-label { font-size: 11px; color: #7a9ab5; font-weight: 500; margin-top: 6px; line-height: 1.3; }
	.pe-badges { display: flex; flex-direction: column; gap: 10px; }
	.pe-badge { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px; border: 1.5px solid; }
	.pe-badge-emoji { font-size: 24px; line-height: 1; }
	.pe-badge-info { flex: 1; }
	.pe-badge-label { font-size: 14px; font-weight: 700; }
	.pe-badge-desc { font-size: 12px; margin-top: 2px; opacity: 0.75; }
	.pe-empty-badges { text-align: center; color: #aab; font-size: 14px; padding: 20px 0; }
	.pe-materias { display: flex; flex-wrap: wrap; gap: 8px; }
	.pe-materia { background: #eef2f6; color: #003e70; font-size: 13px; font-weight: 500; padding: 6px 14px; border-radius: 20px; }
	.pe-spinner { width: 36px; height: 36px; border: 3px solid #dce6ef; border-top-color: #003e70; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 60px auto; }
	.pe-error { text-align: center; color: #e74c3c; padding: 60px 20px; font-size: 15px; }
	@keyframes spin { to { transform: rotate(360deg); } }
	@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
	.pe-animate { animation: fadeUp 0.3s ease; }
`;

export default function PerfilEstudianteScreen() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [perfil, setPerfil] = useState<PerfilEnriquecido | null>(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!id) return;
		setCargando(true);
		usuariosService.getPerfilEnriquecido(id)
			.then(setPerfil)
			.catch((e: Error) => setError(e.message || 'No se pudo cargar el perfil'))
			.finally(() => setCargando(false));
	}, [id]);

	const iniciales = perfil
		? `${perfil.nombre.charAt(0)}${perfil.apellido.charAt(0)}`.toUpperCase()
		: '?';

	return (
		<>
			<style>{CSS}</style>
			<div className="pe-page">
				<div className="pe-content">
					<button className="pe-back" onClick={() => navigate(-1)}>
						← Volver
					</button>

					{cargando && <div className="pe-spinner" />}

					{!cargando && error && <p className="pe-error">{error}</p>}

					{!cargando && perfil && (
						<div className="pe-card pe-animate">
							{/* Hero */}
							<div className="pe-hero">
								<div className="pe-avatar">{iniciales}</div>
								<div className="pe-hero-info">
									<p className="pe-name">{perfil.nombre} {perfil.apellido}</p>
									<p className="pe-carrera">{perfil.carrera}</p>
									{perfil.semestre && (
										<p className="pe-semestre">Semestre {perfil.semestre}</p>
									)}
								</div>
							</div>

							<div className="pe-body">
								{/* Estadísticas */}
								<div className="pe-section">
									<p className="pe-section-title">Estadísticas</p>
									<div className="pe-stats-grid">
										<div className="pe-stat">
											<div className="pe-stat-num">{perfil.estadisticas.gruposCreados}</div>
											<div className="pe-stat-label">Grupos creados</div>
										</div>
										<div className="pe-stat">
											<div className="pe-stat-num">{perfil.estadisticas.gruposParticipa}</div>
											<div className="pe-stat-label">Grupos en los que participa</div>
										</div>
										<div className="pe-stat">
											<div className="pe-stat-num">{perfil.estadisticas.mensajesEnviados}</div>
											<div className="pe-stat-label">Mensajes enviados</div>
										</div>
									</div>
								</div>

								{/* Insignias */}
								<div className="pe-section">
									<p className="pe-section-title">Insignias</p>
									{perfil.insignias.length === 0 ? (
										<p className="pe-empty-badges">Aún no ha obtenido insignias. ¡Anímate a participar!</p>
									) : (
										<div className="pe-badges">
											{perfil.insignias.map((insignia) => {
												const info = INSIGNIA_INFO[insignia];
												return (
													<div
														key={insignia}
														className="pe-badge"
														style={{ borderColor: info.color + '55', background: info.color + '11' }}
													>
														<span className="pe-badge-emoji">{info.emoji}</span>
														<div className="pe-badge-info">
															<div className="pe-badge-label" style={{ color: info.color }}>{info.label}</div>
															<div className="pe-badge-desc" style={{ color: info.color }}>{info.desc}</div>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>

								{/* Materias activas */}
								{perfil.asignaturasActivas.length > 0 && (
									<div className="pe-section">
										<p className="pe-section-title">Materias que cursa</p>
										<div className="pe-materias">
											{perfil.asignaturasActivas.map((m, i) => (
												<span key={i} className="pe-materia">{m}</span>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
