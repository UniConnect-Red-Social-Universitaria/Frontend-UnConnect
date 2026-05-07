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
