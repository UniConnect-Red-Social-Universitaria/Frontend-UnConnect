import React from 'react';
import theme from '@uniconnect/theme';

function mergeStyle(base, style) {
	if (!style) return base;
	if (Array.isArray(style)) {
		return Object.assign({}, base, ...style.filter(Boolean));
	}
	return Object.assign({}, base, style);
}

export function Screen({ style, children }) {
	return React.createElement(
		'div',
		{
			style: mergeStyle(
				{
					minHeight: '100dvh',
					backgroundColor: theme.colors.white,
				},
				style
			),
		},
		children
	);
}

export function Header({ title, right, style }) {
	return React.createElement(
		'header',
		{
			style: mergeStyle(
				{
					backgroundColor: theme.colors.primary,
					padding: theme.spacing.md,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				},
				style
			),
		},
		React.createElement(
			'h1',
			{
				style: {
					margin: 0,
					color: theme.colors.gold,
					fontSize: theme.typography.fontSize.lg,
					fontWeight: 700,
				},
			},
			title
		),
		right || null
	);
}

export function Container({ style, children }) {
	return React.createElement(
		'main',
		{
			style: mergeStyle(
				{
					padding: theme.spacing.md,
				},
				style
			),
		},
		children
	);
}

export function Card({ style, children }) {
	return React.createElement(
		'section',
		{
			style: mergeStyle(
				{
					backgroundColor: theme.colors.goldLight,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
				},
				style
			),
		},
		children
	);
}

export function Title({ style, children }) {
	return React.createElement(
		'h2',
		{
			style: mergeStyle(
				{
					margin: 0,
					marginBottom: theme.spacing.sm,
					color: theme.colors.primaryDark,
					fontSize: theme.typography.fontSize.lg,
					fontWeight: 700,
				},
				style
			),
		},
		children
	);
}

export function Text({ style, children }) {
	return React.createElement(
		'p',
		{
			style: mergeStyle(
				{
					margin: 0,
					marginBottom: theme.spacing.sm,
					color: theme.colors.primaryDark,
					fontSize: theme.typography.fontSize.md,
				},
				style
			),
		},
		children
	);
}

export function MutedText({ style, children }) {
	return React.createElement(
		'p',
		{
			style: mergeStyle(
				{
					margin: 0,
					color: theme.colors.primaryMid,
					fontSize: theme.typography.fontSize.sm,
				},
				style
			),
		},
		children
	);
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
	return React.createElement(
		'button',
		{
			type: 'button',
			disabled: !!disabled,
			onClick: onPress,
			onMouseDown: onPressIn,
			onMouseUp: onPressOut,
			onMouseLeave: onPressOut,
			style: mergeStyle(
				{
					backgroundColor: theme.colors.primary,
					padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
					borderRadius: theme.radius.md,
					border: 'none',
					color: theme.colors.white,
					fontSize: theme.typography.fontSize.md,
					fontWeight: 600,
					cursor: disabled ? 'not-allowed' : 'pointer',
				},
				style
			),
		},
		children ?? title
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
	return React.createElement(
		'button',
		{
			type: 'button',
			disabled: !!disabled,
			onClick: onPress,
			onMouseDown: onPressIn,
			onMouseUp: onPressOut,
			onMouseLeave: onPressOut,
			style: mergeStyle(
				{
					backgroundColor: theme.colors.gold,
					padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
					borderRadius: theme.radius.md,
					border: 'none',
					color: theme.colors.primaryDark,
					fontSize: theme.typography.fontSize.md,
					fontWeight: 700,
					cursor: disabled ? 'not-allowed' : 'pointer',
				},
				style
			),
		},
		children ?? title
	);
}

function buildDefaultCloseValue() {
	const date = new Date(Date.now() + 60 * 60 * 1000);
	const pad = (number) => String(number).padStart(2, '0');
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
		if (!visible) {
			return;
		}

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

	return React.createElement(
		'div',
		{
			role: 'dialog',
			'aria-modal': 'true',
			onClick: onClose,
			style: {
				position: 'fixed',
				inset: 0,
				zIndex: 1000,
				backgroundColor: 'rgba(0, 24, 48, 0.62)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 16,
			},
		},
		React.createElement(
			'div',
			{
				onClick: (event) => event.stopPropagation(),
				style: {
					width: 'min(720px, 100%)',
					maxHeight: 'calc(100vh - 32px)',
					overflowY: 'auto',
					backgroundColor: theme.colors.white,
					borderRadius: 20,
					padding: 20,
					border: '1px solid #dbe7f2',
					boxShadow: '0 24px 60px rgba(0, 24, 48, 0.25)',
				},
			},
			React.createElement(
				'div',
				{ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 } },
				React.createElement(
					'div',
					null,
					React.createElement(Title, { style: { marginBottom: 6 } }, title),
					React.createElement(MutedText, { style: { marginBottom: 0 } }, subtitle)
				),
				React.createElement(
					'button',
					{
						type: 'button',
						onClick: onClose,
						style: {
							border: 'none',
							background: '#f3f6fa',
							color: theme.colors.primaryDark,
							borderRadius: 999,
							width: 36,
							height: 36,
							fontSize: 24,
							lineHeight: '36px',
							cursor: 'pointer',
						},
					},
					'×'
				)
			),
			React.createElement(
				'div',
				{ style: { display: 'grid', gap: 16, marginTop: 20 } },
				React.createElement(
					'label',
					{ style: { display: 'grid', gap: 8 } },
					React.createElement(Text, { style: { marginBottom: 0, fontWeight: 700 } }, 'Pregunta'),
					React.createElement('input', {
						type: 'text',
						value: question,
						onChange: (event) => setQuestion(event.target.value),
						placeholder: '¿Qué prefieres para la próxima reunión?',
						style: {
							padding: '12px 14px',
							borderRadius: 12,
							border: `1px solid ${touched && validation.errors.question ? '#d24d57' : '#cfdbe8'}`,
							fontSize: 16,
							outline: 'none',
						},
					}),
					touched && validation.errors.question
						? React.createElement(MutedText, { style: { color: '#d24d57', marginBottom: 0 } }, validation.errors.question)
						: null
				),
				React.createElement(
					'div',
					{ style: { display: 'grid', gap: 12 } },
					React.createElement(Text, { style: { marginBottom: 0, fontWeight: 700 } }, 'Opciones'),
					options.map((option, index) => React.createElement(
						'div',
						{ key: `option-${index}`, style: { display: 'grid', gap: 8 } },
						React.createElement(
							'div',
							{ style: { display: 'flex', gap: 8, alignItems: 'center' } },
							React.createElement('input', {
								type: 'text',
								value: option,
								onChange: (event) => updateOption(index, event.target.value),
								placeholder: `Opción ${index + 1}`,
								style: {
									flex: 1,
									padding: '12px 14px',
									borderRadius: 12,
									border: `1px solid ${touched && validation.optionErrors[index] ? '#d24d57' : '#cfdbe8'}`,
									fontSize: 16,
									outline: 'none',
								},
							}),
							options.length > 2
								? React.createElement(
									'button',
									{
										type: 'button',
										onClick: () => removeOption(index),
										style: {
											border: 'none',
											background: '#f3e2d4',
											color: theme.colors.primaryDark,
											borderRadius: 999,
											padding: '8px 12px',
											fontWeight: 700,
											cursor: 'pointer',
										},
									},
									'Quitar'
								)
								: null
						),
						touched && validation.optionErrors[index]
							? React.createElement(MutedText, { style: { color: '#d24d57', marginBottom: 0 } }, validation.optionErrors[index])
							: null
					)),
					React.createElement(
						'button',
						{
							type: 'button',
							onClick: addOption,
							style: {
								alignSelf: 'flex-start',
								border: `1px dashed ${theme.colors.primaryMid}`,
								background: '#f8fbff',
								color: theme.colors.primaryMid,
								padding: '10px 14px',
								borderRadius: 12,
								fontWeight: 700,
								cursor: 'pointer',
							},
						},
						'Agregar opción'
					),
					touched && validation.errors.options
						? React.createElement(MutedText, { style: { color: '#d24d57', marginBottom: 0 } }, validation.errors.options)
						: null
				),
				React.createElement(
					'div',
					{ style: { display: 'grid', gap: 12 } },
					React.createElement(
						'label',
						{ style: { display: 'flex', gap: 10, alignItems: 'center' } },
						React.createElement('input', {
							type: 'checkbox',
							checked: autoCloseEnabled,
							onChange: (event) => {
								setAutoCloseEnabled(event.target.checked);
								if (event.target.checked && !autoCloseAt) {
									setAutoCloseAt(buildDefaultCloseValue());
								}
							},
						}),
						React.createElement(Text, { style: { marginBottom: 0, fontWeight: 700 } }, 'Cierre automático')
					),
					autoCloseEnabled
						? React.createElement(
							'label',
							{ style: { display: 'grid', gap: 8 } },
							React.createElement(Text, { style: { marginBottom: 0, fontWeight: 700 } }, 'Fecha y hora de cierre'),
							React.createElement('input', {
								type: 'datetime-local',
								value: autoCloseAt,
								onChange: (event) => setAutoCloseAt(event.target.value),
								style: {
									padding: '12px 14px',
									borderRadius: 12,
									border: `1px solid ${touched && validation.errors.autoCloseAt ? '#d24d57' : '#cfdbe8'}`,
									fontSize: 16,
									outline: 'none',
								},
							}),
							touched && validation.errors.autoCloseAt
								? React.createElement(MutedText, { style: { color: '#d24d57', marginBottom: 0 } }, validation.errors.autoCloseAt)
								: React.createElement(MutedText, { style: { marginBottom: 0 } }, 'Se recomienda una fecha futura')
						)
						: null
				),
				submitError ? React.createElement(MutedText, { style: { color: '#d24d57', marginBottom: 0 } }, submitError) : null,
				React.createElement(
					'div',
					{ style: { display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' } },
					React.createElement(SecondaryButton, { title: cancelLabel, onPress: onClose, disabled: submitting }),
					React.createElement(PrimaryButton, { title: submitting ? 'Creando...' : submitLabel, onPress: handleSubmit, disabled: submitDisabled })
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
		{
			style: mergeStyle(
				{
					marginBottom: theme.spacing.md,
					backgroundColor: '#f8fbff',
					border: '1px solid #dbe7f2',
				},
				style
			),
		},
			resultadosFinales
				? React.createElement(
					'div',
					{
						style: {
							marginBottom: theme.spacing.sm,
							padding: '8px 12px',
							borderRadius: 12,
							backgroundColor: '#f3e2d4',
							color: '#8f4f1b',
							fontSize: theme.typography.fontSize.sm,
							fontWeight: 700,
						},
					},
					'Resultados finales'
				)
				: null,
		React.createElement(
			'div',
			{
				style: {
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					gap: theme.spacing.sm,
					marginBottom: theme.spacing.xs,
				},
			},
			React.createElement(Title, { style: { marginBottom: 0, flex: 1 } }, encuesta.question),
			React.createElement(
				'span',
				{
					style: {
						padding: '4px 10px',
						borderRadius: 999,
						backgroundColor: abierta ? '#dff3ea' : '#f3e2d4',
						color: abierta ? '#176b44' : '#8f4f1b',
						fontSize: theme.typography.fontSize.xs,
						fontWeight: 700,
						whiteSpace: 'nowrap',
					},
				},
				abierta ? 'Abierta' : 'Cerrada'
			)
		),
		cierraEn || cerradaEn
			? React.createElement(
				MutedText,
				{ style: { marginBottom: theme.spacing.md } },
				abierta ? `Cierra el ${cierraEn}` : `Cerró el ${cerradaEn}`
			)
			: null,
		React.createElement(
			'div',
			{
				style: {
					display: 'grid',
					gap: theme.spacing.sm,
				},
			},
			opciones.map((option) => {
				const votos = Number(option.votos || 0);
				const porcentaje = Number.isFinite(option.porcentaje)
					? Number(option.porcentaje)
					: totalVotos > 0
						? (votos / totalVotos) * 100
						: 0;

				const optionBody = React.createElement(
					'div',
					{
						style: {
							display: 'grid',
							gap: 6,
						},
					},
					React.createElement(
						'div',
						{
							style: {
								display: 'flex',
								justifyContent: 'space-between',
								gap: theme.spacing.sm,
								alignItems: 'center',
							},
						},
						React.createElement(Text, { style: { marginBottom: 0, flex: 1 } }, option.text),
						React.createElement(
							'span',
							{ style: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primaryMid, fontWeight: 700 } },
							formatPercentage(porcentaje)
						)
					),
					React.createElement(
						'div',
						{
							style: {
								height: 8,
								borderRadius: 999,
								backgroundColor: '#e7eff7',
								overflow: 'hidden',
							},
						},
						React.createElement('div', {
							style: {
								height: '100%',
								width: `${Math.max(4, Math.min(100, porcentaje))}%`,
								backgroundColor: resultadosFinales ? '#8f4f1b' : theme.colors.primaryMid,
							},
						})
					),
					React.createElement(
						MutedText,
						{ style: { marginBottom: 0 } },
						`${votos} voto${votos === 1 ? '' : 's'}`
					)
				);

				if (!abierta || !onVote) {
					return React.createElement(
						'div',
						{
							key: option.id,
							style: {
								padding: theme.spacing.sm,
								borderRadius: theme.radius.md,
								backgroundColor: resultadosFinales ? '#fffaf4' : '#ffffff',
								border: `1px solid ${resultadosFinales ? '#efd4bc' : '#e2ebf4'}`,
							},
						},
						optionBody
					);
				}

				return React.createElement(
					'button',
					{
						key: option.id,
						type: 'button',
						onClick: () => handleVote(option.id),
						disabled: !!voting,
						style: mergeStyle(
							{
								padding: theme.spacing.sm,
								borderRadius: theme.radius.md,
								backgroundColor: '#ffffff',
								border: '1px solid #e2ebf4',
								textAlign: 'left',
								cursor: voting ? 'not-allowed' : 'pointer',
							},
							voting ? { opacity: 0.7 } : null
						),
					},
					optionBody
				);
			})
		),
		React.createElement(
			'div',
			{
				style: {
					marginTop: theme.spacing.sm,
					display: 'flex',
					justifyContent: 'space-between',
					gap: theme.spacing.sm,
					alignItems: 'center',
				},
			},
			React.createElement(MutedText, { style: { marginBottom: 0 } }, `${totalVotos} voto${totalVotos === 1 ? '' : 's'}`),
			resultadosFinales
				? React.createElement(MutedText, { style: { marginBottom: 0, fontWeight: 600 } }, 'Votos cerrados')
				: voting
					? React.createElement(MutedText, { style: { marginBottom: 0, fontWeight: 600 } }, 'Actualizando…')
					: null
		)
	);
}
