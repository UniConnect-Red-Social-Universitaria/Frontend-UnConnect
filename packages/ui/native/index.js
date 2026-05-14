import React from 'react';
import { StyleSheet, View, Text as RNText, TouchableOpacity, Modal, ScrollView, TextInput, Switch } from 'react-native';
import theme from '@uniconnect/theme';

export function Screen({ style, children }) {
	return React.createElement(View, { style: [styles.screen, style] }, children);
}

export function Header({ title, right, style }) {
	return React.createElement(
		View,
		{ style: [styles.header, style] },
		React.createElement(RNText, { style: styles.headerTitle }, title),
		right || null
	);
}

export function Container({ style, children }) {
	return React.createElement(View, { style: [styles.container, style] }, children);
}

export function Card({ style, children }) {
	return React.createElement(View, { style: [styles.card, style] }, children);
}

export function Title({ style, children }) {
	return React.createElement(RNText, { style: [styles.title, style] }, children);
}

export function Text({ style, children }) {
	return React.createElement(RNText, { style: [styles.text, style] }, children);
}

export function MutedText({ style, children }) {
	return React.createElement(RNText, { style: [styles.muted, style] }, children);
}

export function PrimaryButton({
	title,
	children,
	onPress,
	onPressIn,
	onPressOut,
	style,
	disabled,
}) {
	const content =
		children ?? React.createElement(RNText, { style: styles.buttonText }, title);

	return React.createElement(
		TouchableOpacity,
		{
			style: [styles.button, disabled && styles.buttonDisabled, style],
			onPress,
			onPressIn,
			onPressOut,
			disabled: !!disabled,
		},
		content
	);
}

export function SecondaryButton({
	title,
	children,
	onPress,
	onPressIn,
	onPressOut,
	style,
	disabled,
}) {
	const content =
		children ?? React.createElement(RNText, { style: styles.buttonSecondaryText }, title);

	return React.createElement(
		TouchableOpacity,
		{
			style: [styles.buttonSecondary, disabled && styles.buttonDisabled, style],
			onPress,
			onPressIn,
			onPressOut,
			disabled: !!disabled,
		},
		content
	);
}

function pad(number) {
	return String(number).padStart(2, '0');
}

function buildDefaultCloseValue() {
	const date = new Date(Date.now() + 60 * 60 * 1000);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeInputValue(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function validatePollForm(question, options, autoCloseEnabled, autoCloseAt) {
	const trimmedQuestion = normalizeInputValue(question);
	const trimmedOptions = options.map(normalizeInputValue);
	const activeOptions = trimmedOptions.filter(Boolean);
	const optionErrors = trimmedOptions.map((option, index) => {
		if (!option) {
			return 'Completa esta opción';
		}
		const duplicateIndex = trimmedOptions.findIndex(
			(current, currentIndex) => currentIndex !== index && current.toLowerCase() === option.toLowerCase(),
		);
		if (duplicateIndex !== -1) {
			return 'No repitas la misma opción';
		}
		return '';
	});

	const errors = {
		question: trimmedQuestion.length < 3 ? 'La pregunta debe tener al menos 3 caracteres' : '',
		options: activeOptions.length < 2 ? 'Agrega al menos dos opciones' : '',
		autoCloseAt: '',
	};

	if (autoCloseEnabled) {
		if (!autoCloseAt) {
			errors.autoCloseAt = 'Indica cuándo debe cerrarse';
		} else {
			const date = new Date(autoCloseAt);
			if (Number.isNaN(date.getTime())) {
				errors.autoCloseAt = 'Usa un formato de fecha válido';
			} else if (date.getTime() <= Date.now()) {
				errors.autoCloseAt = 'La fecha de cierre debe ser futura';
			}
		}
	}

	return {
		question: trimmedQuestion,
		options: activeOptions,
		optionErrors,
		errors,
		hasErrors: Boolean(errors.question || errors.options || errors.autoCloseAt || optionErrors.some(Boolean)),
	};
}

export function PollCreateModal({
	visible,
	title = 'Crear encuesta',
	subtitle = 'Agrega una pregunta, opciones y una fecha de cierre opcional.',
	submitLabel = 'Crear encuesta',
	cancelLabel = 'Cancelar',
	initialQuestion = '',
	onClose,
	onSubmit,
}) {
	const [question, setQuestion] = React.useState(initialQuestion);
	const [options, setOptions] = React.useState(['', '']);
	const [autoCloseEnabled, setAutoCloseEnabled] = React.useState(false);
	const [autoCloseAt, setAutoCloseAt] = React.useState(buildDefaultCloseValue());
	const [touched, setTouched] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	const [submitError, setSubmitError] = React.useState('');

	React.useEffect(() => {
		if (!visible) return;
		setQuestion(initialQuestion);
		setOptions(['', '']);
		setAutoCloseEnabled(false);
		setAutoCloseAt(buildDefaultCloseValue());
		setTouched(false);
		setSubmitting(false);
		setSubmitError('');
	}, [visible, initialQuestion]);

	if (!visible) {
		return null;
	}

	const validation = validatePollForm(question, options, autoCloseEnabled, autoCloseAt);
	const submitDisabled = submitting || validation.hasErrors;

	const updateOption = (index, value) => {
		setOptions((prev) => prev.map((option, currentIndex) => (currentIndex === index ? value : option)));
		setSubmitError('');
	};

	const addOption = () => {
		setOptions((prev) => [...prev, '']);
	};

	const removeOption = (index) => {
		setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, currentIndex) => currentIndex !== index)));
	};

	const handleSubmit = async () => {
		setTouched(true);
		const result = validatePollForm(question, options, autoCloseEnabled, autoCloseAt);

		if (result.hasErrors) {
			return;
		}

		setSubmitting(true);
		setSubmitError('');

		try {
			await onSubmit({
				question: result.question,
				options: result.options,
				autoCloseAt: autoCloseEnabled ? new Date(autoCloseAt).toISOString() : null,
			});
			onClose();
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'No se pudo crear la encuesta');
		} finally {
			setSubmitting(false);
		}
	};

	const optionFields = options.map((option, index) => {
		const optionError = touched ? validation.optionErrors[index] : '';

		return React.createElement(
			View,
			{ key: `option-${index}`, style: styles.optionRowWrap },
			React.createElement(TextInput, {
				style: [styles.textInput, styles.optionInput, optionError && styles.inputError],
				value: option,
				onChangeText: (value) => updateOption(index, value),
				placeholder: `Opción ${index + 1}`,
				placeholderTextColor: '#8aa0b8',
			}),
			options.length > 2
				? React.createElement(
					TouchableOpacity,
					{ onPress: () => removeOption(index), style: styles.removeOptionButton },
					React.createElement(RNText, { style: styles.removeOptionText }, 'Quitar')
				)
				: null,
			optionError ? React.createElement(MutedText, { style: styles.errorText }, optionError) : null
		);
	});

	const questionField = React.createElement(
		View,
		{ style: styles.fieldBlock },
		React.createElement(Text, { style: styles.fieldLabel }, 'Pregunta'),
		React.createElement(TextInput, {
			style: [styles.textInput, touched && validation.errors.question && styles.inputError],
			value: question,
			onChangeText: (value) => setQuestion(value),
			placeholder: '¿Qué prefieres para la próxima reunión?',
			placeholderTextColor: '#8aa0b8',
		}),
		touched && validation.errors.question
			? React.createElement(MutedText, { style: styles.errorText }, validation.errors.question)
			: null
	);

	const optionsField = React.createElement(
		View,
		{ style: styles.fieldBlock },
		React.createElement(Text, { style: styles.fieldLabel }, 'Opciones'),
		optionFields,
		React.createElement(
			TouchableOpacity,
			{ onPress: addOption, style: styles.addOptionButton },
			React.createElement(RNText, { style: styles.addOptionText }, 'Agregar opción')
		),
		touched && validation.errors.options
			? React.createElement(MutedText, { style: styles.errorText }, validation.errors.options)
			: null
	);

	const toggleField = React.createElement(
		View,
		{ style: styles.fieldBlock },
		React.createElement(
			View,
			{ style: styles.toggleRow },
			React.createElement(Text, { style: styles.fieldLabel }, 'Cierre automático'),
			React.createElement(Switch, {
				value: autoCloseEnabled,
				onValueChange: (value) => {
					setAutoCloseEnabled(value);
					if (value && !autoCloseAt) {
						setAutoCloseAt(buildDefaultCloseValue());
					}
				},
				trackColor: { false: '#cfdbe8', true: '#d5bb87' },
				thumbColor: autoCloseEnabled ? theme.colors.primary : '#ffffff',
			})
		),
		autoCloseEnabled
			? React.createElement(
				View,
				{ style: styles.fieldBlock },
				React.createElement(Text, { style: styles.fieldLabel }, 'Fecha y hora de cierre'),
				React.createElement(TextInput, {
					style: [styles.textInput, touched && validation.errors.autoCloseAt && styles.inputError],
					value: autoCloseAt,
					onChangeText: (value) => setAutoCloseAt(value),
					placeholder: 'AAAA-MM-DDTHH:MM',
					placeholderTextColor: '#8aa0b8',
				}),
				touched && validation.errors.autoCloseAt
					? React.createElement(MutedText, { style: styles.errorText }, validation.errors.autoCloseAt)
					: React.createElement(MutedText, { style: styles.helperText }, 'Ejemplo: 2026-05-13T18:30')
			)
			: null
	);

	const footer = React.createElement(
		View,
		{ style: styles.actionsRow },
		React.createElement(SecondaryButton, { title: cancelLabel, onPress: onClose, disabled: submitting }),
		React.createElement(PrimaryButton, { title: submitting ? 'Creando...' : submitLabel, onPress: handleSubmit, disabled: submitDisabled })
	);

	return React.createElement(
		Modal,
		{ visible, transparent: true, animationType: 'fade', onRequestClose: onClose },
		React.createElement(
			View,
			{ style: styles.modalBackdrop },
			React.createElement(TouchableOpacity, {
				activeOpacity: 1,
				onPress: onClose,
				style: StyleSheet.absoluteFillObject,
			}),
			React.createElement(
				View,
				{ style: styles.modalCard },
				React.createElement(
					View,
					{ style: styles.modalHeader },
					React.createElement(
						View,
						{ style: styles.modalHeaderTextWrap },
						React.createElement(Title, { style: styles.modalTitle }, title),
						React.createElement(MutedText, { style: styles.modalSubtitle }, subtitle)
					),
					React.createElement(
						TouchableOpacity,
						{ onPress: onClose, style: styles.closeButton },
						React.createElement(RNText, { style: styles.closeButtonText }, '×')
					)
				),
				React.createElement(
					ScrollView,
					{
						style: styles.modalBody,
						contentContainerStyle: styles.modalBodyContent,
						keyboardShouldPersistTaps: 'handled',
						horizontal: false,
						showsVerticalScrollIndicator: false,
					},
					questionField,
					optionsField,
					toggleField,
					submitError ? React.createElement(MutedText, { style: styles.errorText }, submitError) : null,
					footer
				)
			)
		)
	);
}

function formatDateTime(value) {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleString([], {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatPercentage(value) {
	if (!Number.isFinite(value)) return '0%';
	return `${Math.round(value)}%`;
}

export function PollCard({ encuesta, onVote, voting, style }) {
	const opciones = [...(encuesta.opciones || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
	const totalVotos = opciones.reduce((acc, option) => acc + Number(option.votos || 0), 0);
	const abierta = encuesta.status === 'OPEN';
	const resultadosFinales = !abierta;
	const cierraEn = encuesta.autoCloseAt ? formatDateTime(encuesta.autoCloseAt) : '';
	const cerradaEn = encuesta.closedAt ? formatDateTime(encuesta.closedAt) : '';

	const handleVote = (optionId) => {
		if (!abierta || !onVote || voting) return;
		void onVote(encuesta.id, optionId);
	};

	return React.createElement(
		Card,
		{ style: [styles.pollCard, style] },
		React.createElement(
			View,
			{ style: styles.pollHeader },
			React.createElement(Title, { style: styles.pollTitle }, encuesta.question),
			React.createElement(
				View,
				{ style: [styles.statusBadge, abierta ? styles.statusOpen : styles.statusClosed] },
				React.createElement(
					RNText,
					{ style: [styles.statusText, abierta ? styles.statusTextOpen : styles.statusTextClosed] },
					abierta ? 'Abierta' : 'Cerrada'
				)
			)
		),
		resultadosFinales
			? React.createElement(
				View,
				{ style: styles.pollClosedBanner },
				React.createElement(RNText, { style: styles.pollClosedBannerText }, 'Resultados finales')
			)
			: null,
		cierraEn || cerradaEn
			? React.createElement(
				MutedText,
				{ style: styles.pollMeta },
				abierta
					? `Cierra el ${cierraEn}`
					: `Cerró el ${cerradaEn}`
			)
			: null,
		React.createElement(
			View,
				{ style: styles.optionsWrap },
			opciones.map((option) => {
				const votos = Number(option.votos || 0);
				const porcentaje = Number.isFinite(option.porcentaje)
					? Number(option.porcentaje)
					: totalVotos > 0
						? (votos / totalVotos) * 100
						: 0;

				const optionContent = React.createElement(
					View,
					{ style: styles.optionContent },
					React.createElement(
						View,
						{ style: styles.optionRow },
						React.createElement(Text, { style: styles.optionText }, option.text),
						React.createElement(RNText, { style: styles.optionPercent }, formatPercentage(porcentaje))
					),
					React.createElement(
						View,
						{ style: styles.optionBarTrack },
						React.createElement(View, {
							style: [
								styles.optionBarFill,
								resultadosFinales && styles.optionBarFillClosed,
								{ width: `${Math.max(4, Math.min(100, porcentaje))}%` },
							],
						})
					),
					React.createElement(
						MutedText,
						{ style: styles.optionVotes },
						`${votos} voto${votos === 1 ? '' : 's'}`
					)
				);

				if (!abierta || !onVote) {
					return React.createElement(View, { key: option.id, style: [styles.optionCard, resultadosFinales && styles.optionCardClosed] }, optionContent);
				}

				return React.createElement(
					TouchableOpacity,
					{
						key: option.id,
						style: [styles.optionCard, styles.optionTouchable, voting && styles.optionDisabled],
						onPress: () => handleVote(option.id),
						disabled: !!voting,
					},
					optionContent
				);
			})
		),
		React.createElement(
			View,
			{ style: styles.pollFooter },
			React.createElement(MutedText, null, `${totalVotos} voto${totalVotos === 1 ? '' : 's'}`),
			resultadosFinales
				? React.createElement(MutedText, { style: styles.pollVoting }, 'Votos cerrados')
				: voting
					? React.createElement(MutedText, { style: styles.pollVoting }, 'Actualizando…')
					: null
		)
	);
}

const styles = StyleSheet.create({
	screen: {
		minHeight: '100%',
		flex: 1,
		backgroundColor: theme.colors.white,
	},
	header: {
		backgroundColor: theme.colors.primary,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerTitle: {
		color: theme.colors.gold,
		fontSize: theme.typography.fontSize.lg,
		fontWeight: '700',
	},
	container: {
		flex: 1,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.white,
	},
	card: {
		backgroundColor: theme.colors.goldLight,
		borderRadius: theme.radius.md,
		padding: theme.spacing.md,
	},
	title: {
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.lg,
		fontWeight: '700',
		marginBottom: theme.spacing.sm,
	},
	text: {
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.md,
		marginBottom: theme.spacing.sm,
	},
	muted: {
		color: theme.colors.primaryMid,
		fontSize: theme.typography.fontSize.sm,
	},
	button: {
		backgroundColor: theme.colors.primary,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
		borderRadius: theme.radius.md,
		alignItems: 'center',
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		color: theme.colors.white,
		fontSize: theme.typography.fontSize.md,
		fontWeight: '600',
	},
	buttonSecondary: {
		backgroundColor: theme.colors.gold,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
		borderRadius: theme.radius.md,
		alignItems: 'center',
	},
	buttonSecondaryText: {
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.md,
		fontWeight: '700',
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0, 24, 48, 0.62)',
		justifyContent: 'center',
		padding: theme.spacing.md,
	},
	modalCard: {
		width: '100%',
		maxWidth: 560,
		alignSelf: 'center',
		maxHeight: '88%',
		backgroundColor: theme.colors.white,
		borderRadius: 20,
		padding: theme.spacing.md,
		borderWidth: 1,
		borderColor: '#dbe7f2',
		shadowColor: '#001830',
		shadowOpacity: 0.18,
		shadowRadius: 24,
		shadowOffset: { width: 0, height: 12 },
		elevation: 8,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: theme.spacing.sm,
		marginBottom: theme.spacing.md,
	},
	modalHeaderTextWrap: {
		flex: 1,
		gap: 4,
	},
	modalTitle: {
		marginBottom: 0,
	},
	modalSubtitle: {
		marginBottom: 0,
		lineHeight: 20,
	},
	closeButton: {
		width: 36,
		height: 36,
		borderRadius: 999,
		backgroundColor: '#f3f6fa',
		alignItems: 'center',
		justifyContent: 'center',
	},
	closeButtonText: {
		color: theme.colors.primaryDark,
		fontSize: 22,
		lineHeight: 22,
		fontWeight: '700',
	},
	modalBody: {
		flexGrow: 0,
	},
	modalBodyContent: {
		gap: theme.spacing.md,
		paddingBottom: theme.spacing.xs,
	},
	fieldBlock: {
		gap: 8,
	},
	fieldLabel: {
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.sm,
		fontWeight: '700',
	},
	textInput: {
		minHeight: 48,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#cfdbe8',
		backgroundColor: '#ffffff',
		paddingHorizontal: theme.spacing.md,
		paddingVertical: 12,
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.md,
	},
	optionInput: {
		flex: 1,
	},
	inputError: {
		borderColor: '#d24d57',
	},
	errorText: {
		marginBottom: 0,
		color: '#b4232a',
	},
	helperText: {
		marginBottom: 0,
		color: theme.colors.primaryMid,
	},
	optionRowWrap: {
		gap: 8,
	},
	optionRowInline: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.sm,
	},
	removeOptionButton: {
		alignSelf: 'flex-start',
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: '#f3e2d4',
	},
	removeOptionText: {
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.sm,
		fontWeight: '700',
	},
	addOptionButton: {
		alignSelf: 'flex-start',
		paddingHorizontal: theme.spacing.md,
		paddingVertical: 10,
		borderRadius: 14,
		backgroundColor: '#edf4fb',
	},
	addOptionText: {
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.sm,
		fontWeight: '700',
	},
	toggleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: theme.spacing.md,
	},
	actionsRow: {
		flexDirection: 'column',
		gap: theme.spacing.sm,
		marginTop: theme.spacing.xs,
	},
	pollCard: {
		marginBottom: theme.spacing.md,
		backgroundColor: '#f8fbff',
		borderWidth: 1,
		borderColor: '#dbe7f2',
	},
	pollClosedBanner: {
		marginBottom: theme.spacing.sm,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 8,
		borderRadius: 12,
		backgroundColor: '#f3e2d4',
	},
	pollClosedBannerText: {
		color: '#8f4f1b',
		fontSize: theme.typography.fontSize.sm,
		fontWeight: '700',
	},
	pollHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: theme.spacing.sm,
		marginBottom: theme.spacing.xs,
	},
	pollTitle: {
		flex: 1,
		marginBottom: 0,
	},
	statusBadge: {
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 4,
		borderRadius: 999,
	},
	statusOpen: {
		backgroundColor: '#dff3ea',
	},
	statusClosed: {
		backgroundColor: '#f3e2d4',
	},
	statusText: {
		fontSize: theme.typography.fontSize.xs,
		fontWeight: '700',
	},
	statusTextOpen: {
		color: '#176b44',
	},
	statusTextClosed: {
		color: '#8f4f1b',
	},
	pollMeta: {
		marginBottom: theme.spacing.md,
	},
	optionsWrap: {
		gap: theme.spacing.sm,
	},
	optionCard: {
		borderRadius: theme.radius.md,
		padding: theme.spacing.sm,
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e2ebf4',
	},
	optionTouchable: {
		opacity: 1,
	},
	optionDisabled: {
		opacity: 0.7,
	},
	optionContent: {
		gap: 6,
	},
	optionRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: theme.spacing.sm,
	},
	optionText: {
		flex: 1,
		marginBottom: 0,
		fontSize: theme.typography.fontSize.md,
		fontWeight: '600',
	},
	optionPercent: {
		fontSize: theme.typography.fontSize.sm,
		color: theme.colors.primaryMid,
		fontWeight: '700',
	},
	optionBarTrack: {
		height: 8,
		borderRadius: 999,
		backgroundColor: '#e7eff7',
		overflow: 'hidden',
	},
	optionBarFill: {
		height: '100%',
		borderRadius: 999,
		backgroundColor: theme.colors.primaryMid,
	},
	optionBarFillClosed: {
		backgroundColor: '#8f4f1b',
	},
	optionCardClosed: {
		backgroundColor: '#fffaf4',
		borderColor: '#efd4bc',
	},
	optionVotes: {
		marginBottom: 0,
	},
	pollFooter: {
		marginTop: theme.spacing.sm,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: theme.spacing.sm,
	},
	pollVoting: {
		fontWeight: '600',
	},
});
