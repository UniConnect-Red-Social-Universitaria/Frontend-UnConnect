import React, { useEffect } from 'react';
import {
	Modal,
	View,
	Text,
	FlatList,
	Pressable,
	ActivityIndicator,
	TouchableWithoutFeedback,
	Keyboard,
} from 'react-native';
import { PrimaryButton } from '@uniconnect/ui';
import { styles } from '../styles/MiembrosGrupoModal.styles';
import { useMiembrosGrupoChat, Miembro } from '../hooks/useMiembrosGrupoChat';

type MiembrosGrupoModalProps = {
	visible: boolean;
	onClose: () => void;
	grupoId: string;
	nombreGrupo: string;
};

export function MiembrosGrupoModal({
	visible,
	onClose,
	grupoId,
	nombreGrupo,
}: MiembrosGrupoModalProps) {
	const { miembros, cargando, cargarMiembros } = useMiembrosGrupoChat(grupoId);

	useEffect(() => {
		if (visible) {
			void cargarMiembros();
		}
	}, [visible, grupoId, cargarMiembros]);

	const renderMiembro = ({ item }: { item: Miembro }) => (
		<View style={styles.miembroItem}>
			<View style={styles.miembroInfo}>
				<Text style={styles.miembroNombre}>
					{item.nombre} {item.apellido}
				</Text>
				{item.email && <Text style={styles.miembroEmail}>{item.email}</Text>}
				{item.esAdministrador && <Text style={styles.adminBadge}>Administrador</Text>}
			</View>
		</View>
	);

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
							<Text style={styles.headerTitle}>Miembros de {nombreGrupo}</Text>
							<Pressable onPress={onClose} style={styles.closeButton}>
								<Text style={styles.closeButtonText}>✕</Text>
							</Pressable>
						</View>

						{/* Contenido */}
						{cargando ? (
							<View style={styles.loadingContainer}>
								<ActivityIndicator size="large" color="#002855" />
								<Text style={styles.loadingText}>Cargando miembros...</Text>
							</View>
						) : miembros.length === 0 ? (
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>No hay miembros en este grupo</Text>
							</View>
						) : (
							<>
								<Text style={styles.miembrosCount}>
									{miembros.length} miembro{miembros.length !== 1 ? 's' : ''}
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
							<Text style={styles.closeButtonModalText}>Cerrar</Text>
						</PrimaryButton>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
