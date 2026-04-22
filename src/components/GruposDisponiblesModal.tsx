import React, { useEffect, useState } from 'react';
import {
	Modal,
	View,
	Text,
	Pressable,
	ActivityIndicator,
	ScrollView,
	Keyboard,
} from 'react-native';
import { styles } from '../styles/GruposScreen.styles';
import theme from '../styles/theme';

type Grupo = {
	id: string;
	nombre: string;
	materia: {
		nombre: string;
	};
	cantidadMiembros: number;
	maxMiembros: number;
	yaPertenece: boolean;
	estaLleno: boolean;
};

type GruposDisponiblesModalProps = {
	visible: boolean;
	onClose: () => void;
	gruposDisponibles: Grupo[];
	processingGrupoId: string | null;
	onUnirse: (grupoId: string) => void;
	loading: boolean;
};

export function GruposDisponiblesModal({
	visible,
	onClose,
	gruposDisponibles,
	processingGrupoId,
	onUnirse,
	loading,
}: GruposDisponiblesModalProps) {
	return (
		<Modal visible={visible} transparent animationType="fade">
			<Pressable style={styles.modalOverlay} onPress={() => Keyboard.dismiss()}>
				<Pressable
					style={[styles.modalContent, { maxHeight: '80%' }]}
					onPress={(e) => e.stopPropagation()}
				>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Grupos Disponibles</Text>
						<Pressable onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeButtonText}>✕</Text>
						</Pressable>
					</View>

					{loading ? (
						<ActivityIndicator color={theme.colors.primary} size="large" />
					) : (
						<ScrollView showsVerticalScrollIndicator={true}>
							{gruposDisponibles.length > 0 ? (
								gruposDisponibles.map((grupo) => {
									const botonDeshabilitado =
										grupo.yaPertenece ||
										grupo.estaLleno ||
										processingGrupoId === grupo.id;
									let textoBoton = 'Unirme';
									if (grupo.yaPertenece) textoBoton = 'Ya eres miembro';
									else if (grupo.estaLleno) textoBoton = 'Grupo lleno';
									else if (processingGrupoId === grupo.id) textoBoton = 'Uniendome...';

									return (
										<View key={grupo.id} style={styles.card}>
											<Text style={styles.groupTitle}>{grupo.nombre}</Text>
											<Text style={styles.groupMateria}>
												Materia: {grupo.materia.nombre}
											</Text>
											<Text style={styles.groupMembers}>
												{grupo.cantidadMiembros}/{grupo.maxMiembros} integrantes
											</Text>
											<Pressable
												onPress={() => onUnirse(grupo.id)}
												disabled={botonDeshabilitado}
												style={[
													styles.joinButton,
													botonDeshabilitado ? styles.joinButtonDisabled : null,
												]}
											>
												<Text style={styles.joinButtonText}>{textoBoton}</Text>
											</Pressable>
										</View>
									);
								})
							) : (
								<Text style={styles.empty}>No hay grupos disponibles por ahora.</Text>
							)}
						</ScrollView>
					)}
				</Pressable>
			</Pressable>
		</Modal>
	);
}
