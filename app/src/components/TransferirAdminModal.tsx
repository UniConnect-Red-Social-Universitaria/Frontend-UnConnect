import React, { useEffect, useState } from 'react';
import {
	Modal,
	View,
	Text,
	FlatList,
	Pressable,
	ActivityIndicator,
	TouchableWithoutFeedback,
	Keyboard,
	Alert,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@uniconnect/ui';
import { styles } from '../styles/MiembrosGrupoModal.styles';
import { gruposService } from '../services/grupos.service';
import { showToast } from '../utils/toast';

type Miembro = {
	id: string;
	nombre: string;
	apellido: string;
	esAdministrador: boolean;
};

type TransferirAdminModalProps = {
	visible: boolean;
	onClose: () => void;
	grupoId: string;
	nombreGrupo: string;
	onTransferido: () => void;
};

export function TransferirAdminModal({
	visible,
	onClose,
	grupoId,
	nombreGrupo,
	onTransferido,
}: TransferirAdminModalProps) {
	const [miembros, setMiembros] = useState<Miembro[]>([]);
	const [cargando, setCargando] = useState(false);
	const [transfiriendo, setTransfiriendo] = useState<string | null>(null);

	useEffect(() => {
		if (visible) {
			cargarMiembros();
		}
	}, [visible, grupoId]);

	const cargarMiembros = async () => {
		setCargando(true);
		try {
			const data = await gruposService.getMiembros(grupoId);
			// Filtrar al admin actual (no puede transferirse a sí mismo)
			const noAdmin = (data as Miembro[]).filter((m) => !m.esAdministrador);
			setMiembros(noAdmin);
		} catch {
			showToast.error('Error al cargar miembros');
		} finally {
			setCargando(false);
		}
	};

	const confirmarTransferencia = (miembro: Miembro) => {
		const mensaje = `¿Nominar a ${miembro.nombre} ${miembro.apellido} como candidato a administrador del grupo "${nombreGrupo}"?\n\nEl candidato deberá aceptar para que la transferencia sea efectiva.`;

		if (Platform.OS === 'web') {
			if (window.confirm(mensaje)) {
				ejecutarTransferencia(miembro.id);
			}
		} else {
			Alert.alert('Nominar candidato', mensaje, [
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Nominar',
					style: 'destructive',
					onPress: () => ejecutarTransferencia(miembro.id),
				},
			]);
		}
	};

	const ejecutarTransferencia = async (candidatoId: string) => {
		setTransfiriendo(candidatoId);
		try {
			await gruposService.iniciarTransferencia(grupoId, candidatoId);
			showToast.success('Candidato nominado. Esperando su respuesta.');
			onClose();
			onTransferido();
		} catch (err: any) {
			showToast.error(err.message || 'Error al nominar candidato');
		} finally {
			setTransfiriendo(null);
		}
	};

	const renderMiembro = ({ item }: { item: Miembro }) => {
		const isProcessing = transfiriendo === item.id;

		return (
			<View style={styles.miembroItem}>
				<View style={styles.miembroInfo}>
					<Text style={styles.miembroNombre}>
						{item.nombre} {item.apellido}
					</Text>
				</View>
				<PrimaryButton
					style={{
						backgroundColor: '#D97706',
						borderRadius: 8,
						paddingHorizontal: 12,
						paddingVertical: 8,
						opacity: isProcessing ? 0.5 : 1,
					}}
					disabled={isProcessing}
					onPress={() => confirmarTransferencia(item)}
				>
					{isProcessing ? (
						<ActivityIndicator size="small" color="#FFF" />
					) : (
						<Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
							Nominar
						</Text>
					)}
				</PrimaryButton>
			</View>
		);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent={true}
			onRequestClose={onClose}
		>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						{/* Header */}
						<View style={styles.header}>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
								<Ionicons name="swap-horizontal" size={20} color="#D97706" />
								<Text style={styles.headerTitle}>Nominar candidato</Text>
							</View>
							<Pressable onPress={onClose} style={styles.closeButton}>
								<Text style={styles.closeButtonText}>✕</Text>
							</Pressable>
						</View>

						<Text
							style={{
								fontSize: 13,
								color: '#64748B',
								paddingHorizontal: 20,
								paddingTop: 12,
								lineHeight: 18,
							}}
						>
							Selecciona al miembro que deseas nominar como candidato a administrador de "{nombreGrupo}". Deberá aceptar la transferencia para que sea efectiva.
						</Text>

						{/* Contenido */}
						{cargando ? (
							<View style={styles.loadingContainer}>
								<ActivityIndicator size="large" color="#002855" />
								<Text style={styles.loadingText}>Cargando miembros...</Text>
							</View>
						) : miembros.length === 0 ? (
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>
									No hay otros miembros a quienes transferir la administración.
								</Text>
							</View>
						) : (
							<>
								<Text style={styles.miembrosCount}>
									{miembros.length} miembro{miembros.length !== 1 ? 's' : ''} disponible
									{miembros.length !== 1 ? 's' : ''}
								</Text>
								<FlatList
									data={miembros}
									renderItem={renderMiembro}
									keyExtractor={(item) => item.id}
									scrollEnabled={true}
									style={styles.list}
									contentContainerStyle={styles.listContent}
								/>
							</>
						)}

						{/* Footer */}
						<PrimaryButton style={styles.closeButtonModal} onPress={onClose}>
							<Text style={styles.closeButtonModalText}>Cancelar</Text>
						</PrimaryButton>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
