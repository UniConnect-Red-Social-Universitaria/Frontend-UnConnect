import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '@uniconnect/theme';
import { usuariosService } from '../services/usuarios.service';
import { materiasService } from '../services/materias.service';
import type { Materia } from '../types/api.types';

export default function EditarPerfilScreen() {
	const navigate = useNavigate();
	const [nombre, setNombre] = useState('');
	const [semestre, setSemestre] = useState('');
	const [materiasCatalogo, setMateriasCatalogo] = useState<Materia[]>([]);
	const [selectedMateriasIds, setSelectedMateriasIds] = useState<string[]>([]);
	
	const [cargando, setCargando] = useState(true);
	const [guardando, setGuardando] = useState(false);
	const [errores, setErrores] = useState({ semestre: '', materias: '' });
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

	const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	const cargarPerfilAcademico = useCallback(async () => {
		setCargando(true);
		try {
			const [perfilData, materiasData] = await Promise.all([
				usuariosService.getPerfil(),
				materiasService.getMaterias(),
			]);

			setNombre(`${perfilData.nombre || ''} ${perfilData.apellido || ''}`.trim());
			setSemestre(perfilData.semestre ? String(perfilData.semestre) : '');

			const catalogoIds = new Set((materiasData || []).map((m) => String(m.id)));
			const idsResueltos = [
				...new Set(
					(perfilData.materiasCursando || [])
						.map((item) => {
							const asString = String(item);
							if (catalogoIds.has(asString)) return asString;
							const match = (materiasData || []).find((m) => m.nombre === asString);
							return match ? String(match.id) : null;
						})
						.filter((id): id is string => id !== null)
				),
			];
			setSelectedMateriasIds(idsResueltos);
			setMateriasCatalogo(materiasData || []);
		} catch (error: any) {
			showMsg(error?.message || 'No se pudo cargar el perfil', 'error');
		} finally {
			setCargando(false);
		}
	}, []);

	useEffect(() => { cargarPerfilAcademico(); }, [cargarPerfilAcademico]);

	const validarFormulario = () => {
		const nErr = { semestre: '', materias: '' };
		let esValido = true;
		const semNum = Number(semestre);

		if (!semestre.trim() || !Number.isInteger(semNum) || semNum <= 0) {
			nErr.semestre = 'Ingresa un semestre válido mayor a 0.';
			esValido = false;
		}
		if (selectedMateriasIds.length === 0) {
			nErr.materias = 'Debes seleccionar al menos una materia para guardar cambios.';
			esValido = false;
		}
		setErrores(nErr);
		return esValido;
	};

	const handleGuardar = async () => {
		if (!validarFormulario()) {
			showMsg('Revisa los campos con error.', 'error');
			return;
		}
		setGuardando(true);
		try {
			await usuariosService.updatePerfil({
				semestre: Number(semestre),
				materiasCursando: [...new Set(selectedMateriasIds)],
			});
			showMsg('Tu perfil académico se actualizó correctamente.');
			await cargarPerfilAcademico();
		} catch (error: any) {
			showMsg(error?.message || 'No se pudieron guardar los cambios', 'error');
		} finally {
			setGuardando(false);
		}
	};

	const toggleMateria = (id: string) => {
		if (selectedMateriasIds.includes(id)) {
			setSelectedMateriasIds(selectedMateriasIds.filter(i => i !== id));
		} else {
			setSelectedMateriasIds([...selectedMateriasIds, id]);
		}
		setErrores(prev => ({ ...prev, materias: '' }));
	};

	return (
		<div style={s.page}>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				.uc-input { width: 100%; padding: 12px 14px; border: 1.5px solid #c5d3df; border-radius: 8px; font-size: 15px; font-family: 'Inter', sans-serif; color: #00284d; outline: none; transition: border-color 0.2s; }
				.uc-input:focus { border-color: #003e70; }
				.uc-input.error { border-color: #e74c3c; }
				.uc-input:disabled { background-color: #f3f4f6; color: #6b7280; border-color: #d1d5db; cursor: not-allowed; }
				.uc-btn-primary { width: 100%; padding: 14px; background: #003e70; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.2s; }
				.uc-btn-primary:hover:not(:disabled) { background: #00284d; }
				.uc-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
				.uc-btn-secondary { width: 100%; padding: 14px; background: transparent; color: #00284d; border: 1.5px solid #c5d3df; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; }
				.uc-btn-secondary:hover:not(:disabled) { border-color: #003e70; color: #003e70; }
				.uc-tag { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; margin: 4px; }
				.uc-tag.active { background: #eef2f6; color: #003e70; border-color: #003e70; }
				.uc-tag:not(.active) { background: #fff; color: #4a6a85; border-color: #dce6ef; }
				.uc-tag:not(.active):hover { border-color: #003e70; color: #003e70; }
				@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
				@keyframes spin { to { transform: rotate(360deg); } }
			`}</style>

			{toast && (
				<div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, backgroundColor: toast.type === 'error' ? '#c0392b' : '#27ae60', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
					{toast.msg}
				</div>
			)}

			<div style={s.content}>
				<div style={s.header}>
					<h1 style={s.title}>Editar perfil académico</h1>
					<p style={s.subtitle}>Actualiza tu semestre y las materias que estás cursando.</p>
				</div>

				{cargando ? (
					<div style={s.centered}>
						<div style={s.spinner} />
						<p style={{ color: '#7a9ab5', marginTop: 12 }}>Cargando perfil...</p>
					</div>
				) : (
					<div style={s.card}>
						<div style={s.inputGroup}>
							<label style={s.label}>Nombre</label>
							<input className="uc-input" value={nombre || 'No disponible'} disabled />
						</div>

						<div style={s.inputGroup}>
							<label style={s.label}>Semestre</label>
							<input 
								type="number" 
								className={`uc-input${errores.semestre ? ' error' : ''}`}
								placeholder="Ej. 5"
								value={semestre}
								onChange={(e) => { setSemestre(e.target.value); setErrores(p => ({...p, semestre: ''})); }}
								disabled={guardando}
							/>
							{errores.semestre && <p style={s.errorText}>{errores.semestre}</p>}
						</div>

						<div style={s.inputGroup}>
							<label style={s.label}>Materias que estás cursando</label>
							<div style={{ padding: '8px 0' }}>
								{materiasCatalogo.map(m => {
									const isSelected = selectedMateriasIds.includes(String(m.id));
									return (
										<span 
											key={m.id} 
											className={`uc-tag${isSelected ? ' active' : ''}`}
											onClick={() => !guardando && toggleMateria(String(m.id))}
										>
											{m.nombre} {isSelected ? '✕' : '+'}
										</span>
									)
								})}
							</div>
							{errores.materias ? (
								<p style={s.errorText}>{errores.materias}</p>
							) : (
								<p style={s.hintText}>Debes mantener al menos una materia seleccionada.</p>
							)}
						</div>

						<div style={s.buttonRow}>
							<button className="uc-btn-primary" onClick={handleGuardar} disabled={guardando}>
								{guardando ? 'Guardando...' : 'Guardar cambios'}
							</button>
							<button className="uc-btn-secondary" onClick={() => navigate(-1)} disabled={guardando}>
								Volver
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

const s: Record<string, React.CSSProperties> = {
	page: { minHeight: '100%', backgroundColor: '#f0f4f8', fontFamily: "'Inter', sans-serif" },
	content: { maxWidth: 500, margin: '0 auto', padding: '40px 20px', animation: 'fadeUp 0.3s ease' },
	header: { textAlign: 'center', marginBottom: 28 },
	title: { margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#00284d' },
	subtitle: { margin: 0, fontSize: 15, color: '#4a6a85' },
	card: { backgroundColor: '#fff', borderRadius: 14, padding: '32px 28px', border: '1px solid #e8eef4', boxShadow: '0 8px 24px rgba(0,62,112,0.06)' },
	inputGroup: { marginBottom: 20 },
	label: { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#00284d' },
	errorText: { margin: '6px 0 0', fontSize: 13, color: '#e74c3c' },
	hintText: { margin: '6px 0 0', fontSize: 13, color: '#7a9ab5' },
	buttonRow: { display: 'flex', gap: 12, marginTop: 12 },
	centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0' },
	spinner: { width: 36, height: 36, border: '3px solid #dce6ef', borderTopColor: theme.colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};