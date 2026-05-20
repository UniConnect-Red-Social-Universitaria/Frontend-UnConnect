import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scrumService } from '../../services/scrum.service';
import type { Sprint, MetricasSprint, HistoriaUsuario } from '../../types/scrum';

export default function SprintDashboard() {
  const { sprintId } = useParams<{ sprintId: string }>();
  const navigate = useNavigate();
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [metricas, setMetricas] = useState<MetricasSprint | null>(null);
  const [historiasUsuario, setHistoriasUsuario] = useState<HistoriaUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sprintId) {
      loadData();
    }
  }, [sprintId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sprintData = await scrumService.getSprintById(sprintId!);
      setSprint(sprintData);

      const historiasData = await scrumService.getHistoriasDelSprint(sprintId!);
      setHistoriasUsuario(historiasData);

      const metricsData = await scrumService.getMetricasSprint(sprintId!);
      setMetricas(metricsData);
    } catch (err) {
      console.error('Error al cargar datos del sprint:', err);
      setError('Error al cargar los datos del sprint. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSprint = async () => {
    try {
      if (sprintId) {
        const updated = await scrumService.iniciarSprint(sprintId);
        setSprint(updated);
        setError(null);
      }
    } catch (err) {
      console.error('Error al iniciar sprint:', err);
      setError('Error al iniciar el sprint.');
    }
  };

  const handleCompleteSprint = async () => {
    try {
      if (sprintId) {
        const updated = await scrumService.cerrarSprint(sprintId);
        setSprint(updated);
        setError(null);
      }
    } catch (err) {
      console.error('Error al completar sprint:', err);
      setError('Error al completar el sprint.');
    }
  };

  const handleCambiarEstadoHU = async (huId: string, nuevoEstado: string) => {
    try {
      await scrumService.cambiarEstadoHistoria(huId, nuevoEstado);
      await loadData();
      setError(null);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError('Error al cambiar el estado de la historia.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .dashboard-header h1 {
          font-size: 26px;
          font-weight: 700;
          color: #003e70;
          margin: 0;
        }
        .header-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        .btn-primary {
          background: #003e70;
          color: white;
        }
        .btn-primary:hover { background: #002a52; }
        .btn-secondary {
          background: #e8f0f8;
          color: #003e70;
          border: 1px solid #003e70;
        }
        .btn-secondary:hover { background: #d4e6f1; }
        .btn-link {
          background: none;
          border: none;
          color: #003e70;
          cursor: pointer;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .metric-card {
          background: white;
          border: 1px solid #dce6ef;
          border-radius: 8px;
          padding: 16px;
        }
        .metric-label {
          font-size: 13px;
          color: #999;
          margin-bottom: 8px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #003e70;
        }
        .sprint-info-section {
          background: white;
          border: 1px solid #dce6ef;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .hu-list {
          background: white;
          border: 1px solid #dce6ef;
          border-radius: 8px;
          overflow: hidden;
        }
        .hu-item {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }
        .hu-item:hover {
          background: #f9fafb;
        }
        .hu-item:last-child {
          border-bottom: none;
        }
        .hu-content {
          cursor: pointer;
          flex: 1;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .loading {
          text-align: center;
          padding: 40px;
        }
        .error-message {
          background: #FEE;
          color: #C33;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          border-left: 4px solid #C33;
        }
      `}</style>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid #003e70',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : sprint ? (
        <>
          <div className="dashboard-header">
            <div style={{ flex: 1 }}>
              <button className="btn-link" onClick={() => navigate('/scrum')}>
                ← Volver a Sprints
              </button>
              <h1>Sprint #{sprint.numero} - {sprint.nombre}</h1>
            </div>
            <div className="header-buttons">
              {sprint.estado === 'PLANEACION' && (
                <button className="btn btn-primary" onClick={handleInitiateSprint}>
                  Iniciar Sprint
                </button>
              )}
              {sprint.estado === 'ACTIVO' && (
                <button className="btn btn-primary" onClick={handleCompleteSprint}>
                  Completar Sprint
                </button>
              )}
            </div>
          </div>

          <div className="sprint-info-section">
            <div className="info-row">
              <strong>Estado:</strong>
              <span style={{
                padding: '4px 10px',
                borderRadius: '4px',
                background: sprint.estado === 'ACTIVO' ? '#46B954' : sprint.estado === 'PLANEACION' ? '#FFB546' : '#003e70',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
              }}>
                {sprint.estado}
              </span>
            </div>
            <div className="info-row">
              <strong>Velocidad Planeada:</strong>
              <span>{sprint.velocidadPlaneada} Story Points</span>
            </div>
            {sprint.velocidadReal && (
              <div className="info-row">
                <strong>Velocidad Real:</strong>
                <span>{sprint.velocidadReal} Story Points</span>
              </div>
            )}
            {sprint.descripcion && (
              <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <strong>Descripción:</strong>
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>{sprint.descripcion}</p>
              </div>
            )}
          </div>

          {metricas && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Velocidad Real</div>
                <div className="metric-value">{metricas.velocidadReal}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Story Points</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">HUs Completadas</div>
                <div className="metric-value">{metricas.huCompletadas}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>de {metricas.huTotales}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Cumplimiento</div>
                <div className="metric-value">{Math.round(metricas.porcentajeCumplimiento)}%</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Promedio</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">En Progreso</div>
                <div className="metric-value">{metricas.huEnProgreso}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Historias</div>
              </div>
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#003e70', marginBottom: '12px' }}>
              Historias de Usuario
            </h2>
            <div className="hu-list">
              {historiasUsuario.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  No hay historias de usuario en este sprint
                </div>
              ) : (
                historiasUsuario.map((hu) => (
                  <div key={hu.id} className="hu-item">
                    <div className="hu-content" onClick={() => navigate(`/scrum/hu/${hu.id}`)}>
                      <strong>{hu.codigo}</strong> - {hu.titulo}
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {hu.storyPoints} SP • Prioridad: {hu.prioridad}
                      </div>
                    </div>
                    <select
                      value={hu.estado}
                      onChange={(e) => handleCambiarEstadoHU(hu.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #dce6ef',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backgroundColor: hu.estado === 'COMPLETADA' ? '#D5F4E6' : '#FFF3CD',
                        color: hu.estado === 'COMPLETADA' ? '#046B3D' : '#664D03',
                      }}
                    >
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_PROGRESO">En Progreso</option>
                      <option value="BLOQUEADA">Bloqueada</option>
                      <option value="COMPLETADA">Completada</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Sprint no encontrado
        </div>
      )}
    </div>
  );
}
