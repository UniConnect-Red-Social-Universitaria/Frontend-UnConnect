import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	Pressable,
	TextInput,
	FlatList,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { styles } from '../styles/DetalleGrupoScreen.styles';
import { useGrupoArchivos } from '../hooks/useGrupoArchivos';
import { useMiembrosGrupo } from '../hooks/useMiembrosGrupo';
import { AgregarMiembroModal } from '../components/AgregarMiembroModal';
import { TransferirAdminModal } from '../components/TransferirAdminModal';
import { authService } from '../services/auth.service';
import { gruposService } from '../services/grupos.service';
import { showToast } from '../utils/toast';

type DetalleGrupoParamList = {
	DetalleGrupo: {
		grupoId: string;
		nombreGrupo: string;
		creadorId: string;
		administradorId: string;
		materiaNombre: string;
		miembrosIds: string[];
	};
	MensajeGrupo: {
		grupoId: string;
		nombreGrupo: string;
		userId?: string | null;
	};
};

type Props = StackScreenProps<DetalleGrupoParamList, 'DetalleGrupo'>;

export function DetalleGrupoScreen({ route, navigation }: Props) {
	const { grupoId, nombreGrupo, creadorId, administradorId, materiaNombre, miembrosIds } =
		route.params;

	const [busqueda, setBusqueda] = useState('');
	const [modalVisible, setModalVisible] = useState(false);
	const [transferirModalVisible, setTransferirModalVisible] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);
	const [abandonando, setAbandonando] = useState(false);

	const {
		archivos,
		loading,
		uploading,
		downloadingId,
		cargarArchivos,
		subirPdf,
		descargarPdf,
	} = useGrupoArchivos(grupoId);

	const {
		isAdmin,
		candidatos,
		cargandoCandidatos,
		agregando,
		cargarCandidatos,
		agregarMiembro,
	} = useMiembrosGrupo(grupoId, administradorId || creadorId, materiaNombre, miembrosIds);

	useEffect(() => {
		cargarArchivos();
	}, [cargarArchivos]);

	useEffect(() => {
		const getUserId = async () => {
			const id = await authService.obtenerIdUsuarioActual();
			setUserId(id);
		};
		getUserId();
	}, []);

	const archivosFiltrados = archivos.filter((a) =>
		a.nombre.toLowerCase().includes(busqueda.toLowerCase())
	);

	const formatSize = (bytes: number) => {
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	};

	const confirmarAbandono = () => {
		Alert.alert('Abandonar grupo', '¿Estás seguro de que quieres abandonar este grupo?', [
			{ text: 'Cancelar', style: 'cancel' },
			{ text: 'Abandonar', style: 'destructive', onPress: abandonarGrupo },
		]);
	};

	const abandonarGrupo = async () => {
		setAbandonando(true);
		try {
			await gruposService.abandonarGrupo(grupoId);
			showToast.success('Has abandonado el grupo');
			navigation.reset({
				index: 0,
				routes: [{ name: 'Principal' as never }],
			});
		} catch (error: any) {
			console.error('Error al abandonar el grupo:', error);
			if (error.message?.includes('transferir')) {
				Alert.alert('Atención', error.message, [
					{ text: 'Cancelar', style: 'cancel' },
					{ text: 'Transferir admin', onPress: () => setTransferirModalVisible(true) },
				]);
			} else {
				showToast.error(error.message || 'No se pudo abandonar el grupo.');
			}
		} finally {
			setAbandonando(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.headerContainer}>
				<Text style={styles.groupTitle}>{nombreGrupo}</Text>
				<Text style={styles.groupSubtitle}>Espacio de trabajo del grupo</Text>
			</View>

			<View style={styles.actionsRow}>
				<Pressable
					style={styles.actionButton}
					onPress={() => navigation.navigate('MensajeGrupo', { grupoId, nombreGrupo })}
				>
					<Text style={styles.actionButtonText}> Ir al Chat</Text>
				</Pressable>

				<Pressable
					style={[styles.actionButton, styles.actionButtonSolid]}
					onPress={subirPdf}
					disabled={uploading}
				>
					{uploading ? (
						<ActivityIndicator color="#FFF" size="small" />
					) : (
						<Text style={styles.actionButtonSolidText}>Subir PDF</Text>
					)}
				</Pressable>

				{isAdmin && (
					<Pressable
						style={[styles.actionButton, styles.actionButtonSuccess]}
						onPress={() => {
							setModalVisible(true);
							cargarCandidatos();
						}}
					>
						<Text style={styles.actionButtonSolidText}>+ Miembro</Text>
					</Pressable>
				)}

				{isAdmin && (
					<Pressable
						style={[
							styles.actionButton,
							{ backgroundColor: '#D97706', borderColor: '#D97706' },
						]}
						onPress={() => setTransferirModalVisible(true)}
					>
						<Text style={styles.actionButtonSolidText}>Transferir</Text>
					</Pressable>
				)}
			</View>

			{userId && (
				<View style={styles.actionsRow}>
					<Pressable
						style={[styles.actionButton, styles.actionButtonDanger]}
						onPress={confirmarAbandono}
						disabled={abandonando}
					>
						{abandonando ? (
							<ActivityIndicator color="#FFF" size="small" />
						) : (
							<Text style={styles.actionButtonSolidText}>Salir del Grupo</Text>
						)}
					</Pressable>
				</View>
			)}

			<AgregarMiembroModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				candidatos={candidatos}
				cargandoCandidatos={cargandoCandidatos}
				agregando={agregando}
				onAgregar={(id) => agregarMiembro(id, () => setModalVisible(false))}
			/>

			<TransferirAdminModal
				visible={transferirModalVisible}
				onClose={() => setTransferirModalVisible(false)}
				grupoId={grupoId}
				nombreGrupo={nombreGrupo}
				onTransferido={() => navigation.goBack()}
			/>

			<View style={styles.searchContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="Buscar archivo por nombre..."
					value={busqueda}
					onChangeText={setBusqueda}
				/>
			</View>

			{loading ? (
				<View style={styles.loaderContainer}>
					<ActivityIndicator size="large" color="#005b96" />
				</View>
			) : (
				<FlatList
					contentContainerStyle={styles.listContainer}
					data={archivosFiltrados}
					keyExtractor={(item) => item.id}
					ListHeaderComponent={
						<Text style={styles.sectionTitle}>Archivos del grupo</Text>
					}
					ListEmptyComponent={
						<Text style={styles.emptyText}>
							{busqueda
								? 'No se encontraron archivos.'
								: 'Aún no hay archivos en este grupo.'}
						</Text>
					}
					renderItem={({ item }) => (
						<View style={styles.fileCard}>
							<View style={styles.fileInfo}>
								<Text style={styles.fileName} numberOfLines={1}>
									{item.nombre}
								</Text>
								<Text style={styles.fileMeta}>
									{formatSize(item.tamanoBytes)} • Subido por{' '}
									{item.subidoPor?.nombre || 'Usuario'}
								</Text>
							</View>

							<Pressable
								style={styles.downloadButton}
								onPress={() => descargarPdf(item.id, item.nombre)}
								disabled={downloadingId === item.id}
							>
								{downloadingId === item.id ? (
									<ActivityIndicator size="small" color="#005b96" />
								) : (
									<Text style={styles.downloadButtonText}>Descargar</Text>
								)}
							</Pressable>
						</View>
					)}
				/>
			)}
		</View>
	);
}
