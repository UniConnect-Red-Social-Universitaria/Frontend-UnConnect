import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scrumService } from '../../services/scrum.service';
import type { Sprint } from '../../types/scrum';

export default function SprintList() {
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    numero: 1,
    nombre: '',
    descripcion: '',
    velocidadPlaneada: 20,
  });

  const loadSprints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scrumService.getSprints();
      setSprints(data);
    } catch (err) {
      console.error('Error al cargar sprints:', err);
      setError('Error al cargar los sprints. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSprints();
  }, []);

  const handleCreateSprint = async () => {
    try {
      if (!formData.nombre.trim()) {
        setError('El nombre del sprint es requerido');
        return;
      }

      await scrumService.createSprint({
        numero: formData.numero,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        velocidadPlaneada: formData.velocidadPlaneada,
      });

      setFormData({
        numero: formData.numero + 1,
        nombre: '',
        descripcion: '',
        velocidadPlaneada: 20,
      });
      setShowForm(false);
      setError(null);
      await loadSprints();
    } catch (err) {
      console.error('Error al crear sprint:', err);
      setError('Error al crear el sprint. Por favor, intenta de nuevo.');
    }
  };

  const getEstadoColor = (estado: string): string => {
    const colors: Record<string, string> = {
      PLANEACION: '#FFB546',
      ACTIVO: '#46B954',
      COMPLETADO: '#003e70',
      CANCELADO: '#E74C3C',
    };
    return colors[estado] || '#999';
  };

  const getProgressPercentage = (sprint: Sprint): number => {
    if (!sprint.velocidadPlaneada || sprint.velocidadPlaneada === 0) return 0;
    return Math.round(((sprint.velocidadReal || 0) / sprint.velocidadPlaneada) * 100);
  };

  return (
    <div style={{ padding: '20px' }}>
      <style>{`
        .sprint-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .sprint-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #003e70;
          margin: 0;
        }
        .btn-primary {
          background: #003e70;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: #002a52; }
        .error-message {
          background: #FEE;
          color: #C33;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          border-left: 4px solid #C33;
        }
        .sprint-card {
          background: white;
          border: 1px solid #dce6ef;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sprint-card:hover {
          border-color: #003e70;
          box-shadow: 0 2px 8px rgba(0, 62, 112, 0.1);
        }
        .sprint-title {
          font-weight: 600;
          color: #003e70;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .sprint-info {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #666;
          flex-wrap: wrap;
        }
        .progress-bar {
          width: 100%;\n          height: 6px;
          background: #eee;
          border-radius: 3px;
          overflow: hidden;
          margin-top: 8px;
        }
        .progress-fill {
          height: 100%;
          background: #46B954;
          transition: width 0.3s;
        }
        .form-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .form-container {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          color: #003e70;
          font-size: 14px;
        }
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #dce6ef;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          box-sizing: border-box;
        }
        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }
        .form-buttons {
          display: flex;
          gap: 8px;
          margin-top: 20px;
        }
        .btn-cancel {
          flex: 1;
          background: #e8f0f8;
          color: #003e70;
          border: none;
          padding: 10px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .loading {
          text-align: center;
          padding: 40px;
        }
        .empty-state {
          background: #f0f4f8;
          padding: 40px;
          border-radius: 8px;
          text-align: center;
          color: #666;
        }
      `}</style>

      <div className="sprint-header">
        <h1>📊 Sprints</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Crear Sprint
        </button>
      </div>

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
      ) : sprints.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No hay sprints creados aún</p>
          <p style={{ fontSize: '14px', margin: 0 }}>
            Haz clic en "+ Crear Sprint" para comenzar
          </p>
        </div>
      ) : (
        <div>
          {sprints.map((sprint) => (
            <div
              key={sprint.id}
              className="sprint-card"
              onClick={() => navigate(`/scrum/${sprint.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="sprint-title">
                    Sprint #{sprint.numero} - {sprint.nombre}
                  </div>
                  {sprint.descripcion && (
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      {sprint.descripcion}
                    </div>
                  )}
                  <div className="sprint-info">
                    <span>📅 {sprint.fechaInicio ? new Date(sprint.fechaInicio).toLocaleDateString() : 'Sin fecha'}</span>
                    <span style={{
                      background: getEstadoColor(sprint.estado),
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {sprint.estado}
                    </span>
                  </div>
                </div>
              </div>
              <div className="sprint-info" style={{ marginBottom: '8px', marginTop: '8px' }}>
                <span>📊 {sprint.velocidadReal || 0} / {sprint.velocidadPlaneada} SP</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getProgressPercentage(sprint)}%` }}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                Progreso: {getProgressPercentage(sprint)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="form-modal" onClick={() => setShowForm(false)}>
          <div className="form-container" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#003e70', marginBottom: '20px' }}>Crear Sprint</h2>

            <div className="form-group">
              <label>Número del Sprint</label>
              <input
                type="number"
                min="1"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="form-group">
              <label>Nombre del Sprint *</label>
              <input
                type="text"
                placeholder="ej: Sprint 1 - Autenticación"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Velocidad Planeada (Story Points)</label>
              <input
                type="number"
                min="1"
                value={formData.velocidadPlaneada}
                onChange={(e) => setFormData({ ...formData, velocidadPlaneada: parseInt(e.target.value) || 20 })}
              />
            </div>

            <div className="form-group">
              <label>Descripción (opcional)</label>
              <textarea
                placeholder="Descripción del sprint..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="form-buttons">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleCreateSprint}>
                Crear Sprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
