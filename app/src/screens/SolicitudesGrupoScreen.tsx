import React, { useCallback, useEffect, useState } from 'react';
import {
	View,
	Text,
	Pressable,
	Image,
	useWindowDimensions,
	FlatList,
	ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, Screen } from '@uniconnect/ui';
import { styles } from '../styles/PrincipalScreenStyles';
import { solicitudesGrupoStyles as localStyles } from '../styles/SolicitudesGrupoScreen.styles';
import { gruposService, authService } from '../services';
import type { SolicitudGrupo } from '../services/grupos.service';
import { showToast } from '../utils/toast';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { useIsDesktop } from '../hooks/useIsDesktop';

type NavigationProp = StackNavigationProp<RootStackParamList, 'SolicitudesGrupo'>;

type GrupoConSolicitudes = {
	grupoId: string;
	grupoNombre: string;
	materiaNombre: string;
	solicitudes: SolicitudGrupo[];
};

export default function SolicitudesGrupoScreen({
	navigation,
}: {
	navigation: NavigationProp;
}) {
	const [gruposConSolicitudes, setGruposConSolicitudes] = useState<GrupoConSolicitudes[]>(
		[]
	);
	const [loading, setLoading] = useState(true);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const { width } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;
	const isDesktop = useIsDesktop();

	const cargarSolicitudes = useCallback(async () => {
		try {
			setLoading(true);

			// Obtener mis grupos (solo los que administro tendrán solicitudes)
			const misGrupos = await gruposService.getGrupos();

			// Para cada grupo que administro, obtener solicitudes pendientes
			const userId = await authService.obtenerIdUsuarioActual();
			const gruposAdmin = (misGrupos as any[]).filter(
				(g) => g.creadorId === userId || g.administradorId === userId
			);

			const resultados: GrupoConSolicitudes[] = [];

			for (const grupo of gruposAdmin) {
				try {
					const solicitudes = await gruposService.getSolicitudesGrupo(grupo.id);
					if (solicitudes.length > 0) {
						resultados.push({
							grupoId: grupo.id,
							grupoNombre: grupo.nombre,
							materiaNombre: grupo.materia?.nombre || '',
							solicitudes,
						});
					}
				} catch {
					// Si no tenemos permiso para un grupo, lo ignoramos
				}
			}

			setGruposConSolicitudes(resultados);
		} catch (err: any) {
			showToast.error('Error al cargar solicitudes');
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			cargarSolicitudes();
			return undefined;
		}, [cargarSolicitudes])
	);

	const handleAprobar = async (grupoId: string, solicitudId: string) => {
		setProcessingId(solicitudId);
		try {
			await gruposService.aprobarSolicitud(grupoId, solicitudId);
			showToast.success('Solicitud aprobada. El estudiante fue agregado al grupo.');
			await cargarSolicitudes();
		} catch (err: any) {
			showToast.error(err.message || 'Error al aprobar solicitud');
		} finally {
			setProcessingId(null);
		}
	};

	const handleRechazar = async (grupoId: string, solicitudId: string) => {
		setProcessingId(solicitudId);
		try {
			await gruposService.rechazarSolicitud(grupoId, solicitudId);
			showToast.info('Solicitud rechazada.');
			await cargarSolicitudes();
		} catch (err: any) {
			showToast.error(err.message || 'Error al rechazar solicitud');
		} finally {
			setProcessingId(null);
		}
	};

	const formatFecha = (fecha: string) => {
		const d = new Date(fecha);
		return d.toLocaleDateString('es-CO', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const totalSolicitudes = gruposConSolicitudes.reduce(
		(acc, g) => acc + g.solicitudes.length,
		0
	);

	const handleLogout = async () => {
		try {
			await authService.logout();
			navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
		} catch {
			showToast.error('Error al cerrar sesión');
		}
	};

	const renderSolicitud = (grupoId: string, solicitud: SolicitudGrupo) => {
		const isProcessing = processingId === solicitud.id;
		const nombreCompleto = [
			solicitud.solicitante?.nombre,
			solicitud.solicitante?.apellido,
		]
			.filter(Boolean)
			.join(' ');

		return (
			<View key={solicitud.id} style={localStyles.card}>
				<View style={localStyles.cardRow}>
					<View style={localStyles.solicitanteInfo}>
						<Text style={localStyles.solicitanteNombre}>
							{nombreCompleto || 'Estudiante'}
						</Text>
						{solicitud.solicitante?.correo ? (
							<Text style={localStyles.solicitanteCorreo}>
								{solicitud.solicitante.correo}
							</Text>
						) : null}
						<Text style={localStyles.solicitanteFecha}>
							{formatFecha(solicitud.createdAt)}
						</Text>
					</View>

					<View style={localStyles.actionsRow}>
						<PrimaryButton
							style={[
								localStyles.approveButton,
								isProcessing ? localStyles.actionButtonDisabled : null,
							]}
							disabled={isProcessing}
							onPress={() => handleAprobar(grupoId, solicitud.id)}
						>
							<Text style={localStyles.actionButtonText}>
								{isProcessing ? '...' : 'Aprobar'}
							</Text>
						</PrimaryButton>

						<PrimaryButton
							style={[
								localStyles.rejectButton,
								isProcessing ? localStyles.actionButtonDisabled : null,
							]}
							disabled={isProcessing}
							onPress={() => handleRechazar(grupoId, solicitud.id)}
						>
							<Text style={localStyles.actionButtonText}>
								{isProcessing ? '...' : 'Rechazar'}
							</Text>
						</PrimaryButton>
					</View>
				</View>
			</View>
		);
	};

	const renderGrupoSection = ({ item }: { item: GrupoConSolicitudes }) => (
		<View style={localStyles.grupoSection}>
			<View style={localStyles.grupoHeader}>
				<View style={localStyles.grupoIconWrap}>
					<Ionicons name="people" size={18} color="#003d70" />
				</View>
				<View style={localStyles.grupoHeaderText}>
					<Text style={localStyles.grupoNombre}>{item.grupoNombre}</Text>
					<Text style={localStyles.grupoMateria}>{item.materiaNombre}</Text>
				</View>
				<Text style={localStyles.solicitudesCount}>{item.solicitudes.length}</Text>
			</View>

			{item.solicitudes.map((sol) => renderSolicitud(item.grupoId, sol))}
		</View>
	);

	return (
		<DesktopSidebar navigation={navigation} activeScreen="Notificaciones">
			<Screen style={styles.container}>
				{!isDesktop && (
					<View style={styles.header}>
						<View style={styles.headerLeft}>
							<Image
								source={require('../../assets/images/logo-caldas.png')}
								style={[styles.brandLogo, { width: logoWidth }]}
								resizeMode="contain"
							/>
						</View>

						<View style={styles.headerCenter}>
							<Pressable
								style={styles.iconButton}
								onPress={() => navigation.navigate('EditarPerfil')}
							>
								<Ionicons name="person-circle-outline" size={32} color="#007AFF" />
							</Pressable>
							<Pressable
								style={styles.iconButton}
								onPress={() => navigation.navigate('Notificaciones')}
							>
								<Ionicons name="notifications-outline" size={32} color="#007AFF" />
							</Pressable>
						</View>

						<View style={styles.headerRight}>
							<PrimaryButton style={styles.logoutButton} onPress={handleLogout}>
								<Text style={styles.logoutText}>Salir</Text>
								<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
							</PrimaryButton>
						</View>
					</View>
				)}

				<View style={styles.mainContent}>
					<Text style={styles.greeting}>Solicitudes de Grupo</Text>
					<Text style={styles.subtitle}>
						{totalSolicitudes > 0
							? `Tienes ${totalSolicitudes} solicitud${totalSolicitudes > 1 ? 'es' : ''} pendiente${totalSolicitudes > 1 ? 's' : ''} de ingreso.`
							: 'Revisa las solicitudes de ingreso a tus grupos.'}
					</Text>

					{loading ? (
						<ActivityIndicator size="large" color="#003d70" style={{ marginTop: 30 }} />
					) : (
						<FlatList
							data={gruposConSolicitudes}
							renderItem={renderGrupoSection}
							keyExtractor={(item) => item.grupoId}
							contentContainerStyle={
								gruposConSolicitudes.length === 0
									? localStyles.emptyListContainer
									: localStyles.listContainer
							}
							ListEmptyComponent={
								<View style={localStyles.emptyState}>
									<View style={localStyles.emptyIconWrap}>
										<Ionicons name="checkmark-circle-outline" size={36} color="#003d70" />
									</View>
									<Text style={localStyles.emptyTitle}>Sin solicitudes pendientes</Text>
									<Text style={localStyles.emptyText}>
										Cuando un estudiante solicite unirse a uno de tus grupos, aparecerá
										aquí para que puedas aprobar o rechazar.
									</Text>
								</View>
							}
						/>
					)}
				</View>

				{!isDesktop && (
					<View style={styles.bottomBar}>
						<Pressable
							style={styles.footerTab}
							onPress={() => navigation.navigate('Principal')}
							accessibilityLabel="Inicio"
						>
							<Ionicons name="home-outline" size={24} style={styles.footerIcon} />
						</Pressable>

						<Pressable
							style={styles.footerTab}
							onPress={() => navigation.navigate('Grupos')}
							accessibilityLabel="Grupos"
						>
							<Ionicons name="people-outline" size={24} style={styles.footerIcon} />
						</Pressable>

						<Pressable
							style={styles.footerTab}
							onPress={() => navigation.navigate('Eventos')}
							accessibilityLabel="Eventos"
						>
							<Ionicons name="calendar-outline" size={24} style={styles.footerIcon} />
						</Pressable>

						<Pressable
							style={styles.footerTab}
							onPress={() => navigation.navigate('Contactos')}
							accessibilityLabel="Contactos"
						>
							<Ionicons name="chatbubbles-outline" size={24} style={styles.footerIcon} />
						</Pressable>
					</View>
				)}
			</Screen>
		</DesktopSidebar>
	);
}
