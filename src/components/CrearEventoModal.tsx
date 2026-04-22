import React, { useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
	Modal,
	View,
	Text,
	TextInput,
	Pressable,
	ActivityIndicator,
	Alert,
	Keyboard,
	Platform,
} from 'react-native';
import { styles } from '../styles/EventosScreen.styles';
import theme from '../styles/theme';
import { apiClient } from '../services';

type CrearEventoModalProps = {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
};

function formatearFechaEvento(fechaIso: string): string {
	const fecha = new Date(fechaIso);
	if (Number.isNaN(fecha.getTime())) return 'Fecha inválida';

	return new Intl.DateTimeFormat('es-CO', {
		dateStyle: 'full',
		timeStyle: 'short',
	}).format(fecha);
}

export function CrearEventoModal({ visible, onClose, onSuccess }: CrearEventoModalProps) {
	const [publicando, setPublicando] = useState(false);
	const [mensajePublicacion, setMensajePublicacion] = useState<string | null>(null);
	const [formulario, setFormulario] = useState({
		titulo: '',
		descripcion: '',
		lugar: '',
		fechaEventoInput: '',
	});
	const [isDatePickerVisible, setDatePickerVisible] = useState(false);

	const showDatePicker = () => setDatePickerVisible(true);
	const hideDatePicker = () => setDatePickerVisible(false);

	const handleConfirmDate = (date: Date) => {
		setFormulario((prev) => ({ ...prev, fechaEventoInput: date.toISOString() }));
		hideDatePicker();
	};

	const handleWebDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (!value) return;

		const [date, time] = value.split('T');
		const [year, month, day] = date.split('-');
		const [hour, minute] = time.split(':');

		const localDate = new Date(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hour),
			Number(minute)
		);
		setFormulario((prev) => ({ ...prev, fechaEventoInput: localDate.toISOString() }));
	};

	const actualizarCampo = (campo: keyof typeof formulario, valor: string) => {
		setFormulario((prev) => ({ ...prev, [campo]: valor }));
	};

	const publicarEvento = async () => {
		const { titulo, descripcion, lugar, fechaEventoInput } = formulario;

		if (!titulo.trim()) return setMensajePublicacion('Debes escribir un título.');
		if (!descripcion.trim()) return setMensajePublicacion('Debes escribir una descripción.');
		if (!lugar.trim()) return setMensajePublicacion('Debes escribir el lugar del evento.');
		if (!fechaEventoInput.trim())
			return setMensajePublicacion('Debes seleccionar la fecha del evento.');

		const fecha = new Date(fechaEventoInput.trim());
		if (Number.isNaN(fecha.getTime())) {
			return setMensajePublicacion('La fecha tiene un formato inválido.');
		}

		if (fecha <= new Date()) {
			Alert.alert('Fecha inválida', 'La fecha del evento debe ser futura.');
			return;
		}

		setPublicando(true);
		setMensajePublicacion(null);

		try {
			await apiClient.post('/api/eventos', {
				titulo: titulo.trim(),
				descripcion: descripcion.trim(),
				lugar: lugar.trim(),
				fechaEvento: fecha.toISOString(),
			});

			limpiarYProcesarExito();
		} catch (err) {
			setMensajePublicacion(err instanceof Error ? err.message : 'No se pudo publicar el evento.');
		} finally {
			setPublicando(false);
		}
	};

	const limpiarYProcesarExito = () => {
		setFormulario({ titulo: '', descripcion: '', lugar: '', fechaEventoInput: '' });
		setMensajePublicacion(null);
		onClose();
		onSuccess();
		Alert.alert('Éxito', 'Evento publicado correctamente');
	};

	const cancelar = () => {
		setFormulario({ titulo: '', descripcion: '', lugar: '', fechaEventoInput: '' });
		setMensajePublicacion(null);
		onClose();
	};

	return (
		<Modal visible={visible} transparent animationType="fade">
			<Pressable style={styles.modalOverlay} onPress={() => Keyboard.dismiss()}>
				<Pressable
					style={[styles.modalContent, { maxHeight: '90%' }]}
					onPress={(e) => e.stopPropagation()}
				>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Publicar Evento</Text>
						<Pressable onPress={cancelar} style={styles.closeButton}>
							<Text style={styles.closeButtonText}>✕</Text>
						</Pressable>
					</View>

					{mensajePublicacion && (
						<Text style={styles.formMessage}>{mensajePublicacion}</Text>
					)}

					<TextInput
						value={formulario.titulo}
						onChangeText={(val) => actualizarCampo('titulo', val)}
						placeholder="Título"
						placeholderTextColor={theme.colors.primaryMid}
						style={styles.input}
					/>

					<TextInput
						value={formulario.descripcion}
						onChangeText={(val) => actualizarCampo('descripcion', val)}
						placeholder="Descripción"
						placeholderTextColor={theme.colors.primaryMid}
						style={[styles.input, styles.inputMultiline]}
						multiline
					/>

					<TextInput
						value={formulario.lugar}
						onChangeText={(val) => actualizarCampo('lugar', val)}
						placeholder="Lugar"
						placeholderTextColor={theme.colors.primaryMid}
						style={styles.input}
					/>

					{Platform.OS === 'web' ? (
						<input
							type="datetime-local"
							value={
								formulario.fechaEventoInput
									? new Date(formulario.fechaEventoInput)
											.toISOString()
											.slice(0, 16)
									: ''
							}
							onChange={handleWebDateChange}
							style={{
								width: '100%',
								padding: 10,
								borderRadius: 8,
								border: '1px solid #ccc',
								marginBottom: 12,
								fontFamily: 'inherit',
							}}
						/>
					) : (
						<View>
							<Pressable onPress={showDatePicker} style={styles.input}>
								<Text
									style={{
										color: formulario.fechaEventoInput
											? theme.colors.primary
											: theme.colors.primaryMid,
									}}
								>
									{formulario.fechaEventoInput
										? formatearFechaEvento(formulario.fechaEventoInput)
										: 'Selecciona la fecha y hora'}
								</Text>
							</Pressable>
							<DateTimePickerModal
								isVisible={isDatePickerVisible}
								mode="datetime"
								display={Platform.OS === 'ios' ? 'spinner' : 'default'}
								onConfirm={handleConfirmDate}
								onCancel={hideDatePicker}
								locale="es-CO"
								minimumDate={new Date()}
								pickerContainerStyleIOS={{ backgroundColor: theme.colors.white }}
								pickerStyleIOS={{ backgroundColor: theme.colors.white }}
								textColor={theme.colors.primary}
							/>
						</View>
					)}

					<Pressable
						onPress={publicarEvento}
						disabled={publicando}
						style={({ pressed }) => [
							styles.button,
							pressed && !publicando ? styles.buttonPressed : null,
							publicando ? styles.buttonDisabled : null,
						]}
					>
						<Text style={styles.buttonText}>
							{publicando ? 'Publicando...' : 'Publicar evento'}
						</Text>
					</Pressable>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
