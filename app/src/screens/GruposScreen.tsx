import React, { useState, useEffect } from 'react';
import {
	ActivityIndicator,
	Image,
	Pressable,
	ScrollView,
	Text,
	View,
	useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, Screen } from '@uniconnect/ui';

import theme from '../styles/theme';
import { styles } from '../styles/GruposScreen.styles';
import { styles as principalStyles } from '../styles/PrincipalScreenStyles';
import { useGrupos } from '../hooks/useGrupos';
import { CrearGrupoModal } from '../components/CrearGrupoModal';
import { GruposDisponiblesModal } from '../components/GruposDisponiblesModal';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { authService } from '../services';
import { showToast } from '../utils/toast';

type RootStackParamList = {
	Principal: undefined;
	Eventos: undefined;
	Grupos: undefined;
	Contactos: undefined;
	Notificaciones: undefined;
	Login: undefined;
	EditarPerfil: undefined;
	DetalleGrupo: {
		grupoId: string;
		nombreGrupo: string;
		creadorId: string;
		administradorId: string;
		materiaId: string;
		materiaNombre: string;
		miembrosIds: string[];
	};
};

type GruposScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Grupos'>;

type GruposScreenProps = {
	navigation: GruposScreenNavigationProp;
};

export function GruposScreen({ navigation }: GruposScreenProps) {
	const [crearGrupoModalVisible, setCrearGrupoModalVisible] = useState(false);
	const [gruposDisponiblesModalVisible, setGruposDisponiblesModalVisible] =
		useState(false);

	const {
		grupos,
		gruposDisponibles,
		materiasUsuario,
		loading,
		error,
		processingGrupoId,
		solicitarIngreso,
		cargarGrupos,
	} = useGrupos(navigation);
	const isDesktop = useIsDesktop();
	const unreadNotifications = useUnreadNotifications();
	const { width } = useWindowDimensions();
	const logoWidth = width < 380 ? 150 : width < 480 ? 180 : 220;

	const handleLogout = async () => {
		try {
			await authService.logout();
			navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
		} catch {
			showToast.error('Error al cerrar sesión');
		}
	};

	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			cargarGrupos();
		});
		return unsubscribe;
	}, [navigation, cargarGrupos]);

	const handleModalSuccess = async () => {
		const token = await AsyncStorage.getItem('userToken');
		if (token) await cargarGrupos();
	};

	return (
		<DesktopSidebar navigation={navigation} activeScreen="Grupos">
			<Screen style={styles.container}>
				{!isDesktop && (
					<View style={principalStyles.header}>
						<View style={principalStyles.headerLeft}>
							<Image
								source={require('../../assets/images/logo-caldas.png')}
								style={[principalStyles.brandLogo, { width: logoWidth }]}
								resizeMode="contain"
							/>
						</View>

						<View style={principalStyles.headerCenter}>
							<Pressable
								style={principalStyles.iconButton}
								onPress={() => navigation.navigate('EditarPerfil')}
							>
								<Ionicons name="person-circle-outline" size={32} color="#007AFF" />
							</Pressable>
							<Pressable
								style={principalStyles.iconButton}
								onPress={() => navigation.navigate('Notificaciones')}
							>
								<View style={{ position: 'relative' }}>
									<Ionicons name="notifications-outline" size={32} color="#007AFF" />
									{unreadNotifications > 0 && (
										<View
											style={{
												position: 'absolute',
												top: -2,
												right: -4,
												backgroundColor: '#E53935',
												borderRadius: 10,
												minWidth: 18,
												height: 18,
												justifyContent: 'center',
												alignItems: 'center',
												paddingHorizontal: 3,
											}}
										>
											<Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
												{unreadNotifications > 99 ? '99+' : unreadNotifications}
											</Text>
										</View>
									)}
								</View>
							</Pressable>
						</View>

						<View style={principalStyles.headerRight}>
							<PrimaryButton style={principalStyles.logoutButton} onPress={handleLogout}>
								<Text style={principalStyles.logoutText}>Salir</Text>
								<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
							</PrimaryButton>
						</View>
					</View>
				)}

				<View style={styles.contentWrapper}>
					<View
						style={{
							width: '100%',
							paddingHorizontal: 16,
							paddingTop: 16,
							paddingBottom: 8,
						}}
					>
						<Text style={principalStyles.greeting}>Mis Grupos</Text>
						<Text style={principalStyles.subtitle}>Comunidad Universidad de Caldas</Text>
					</View>

					{loading && <ActivityIndicator color={theme.colors.primary} size="large" />}
					{error && (
						<>
							<Text style={styles.error}>{error}</Text>
							<PrimaryButton
								onPress={() => cargarGrupos()}
								style={{
									alignSelf: 'center',
									marginTop: 8,
								}}
							>
								<Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
							</PrimaryButton>
						</>
					)}

					{!loading && !error && (
						<View style={[styles.scrollView, { flex: 1 }]}>
							<View style={[styles.sectionCard, { flex: 1 }]}>
								<View style={styles.sectionHeaderContainer}>
									<View style={{ flexDirection: 'row', gap: 8 }}>
										<PrimaryButton
											style={styles.createButton}
											onPress={() => setGruposDisponiblesModalVisible(true)}
										>
											<Text style={styles.createButtonText}>+ Explorar</Text>
										</PrimaryButton>
										<PrimaryButton
											style={styles.createButton}
											onPress={() => setCrearGrupoModalVisible(true)}
										>
											<Text style={styles.createButtonText}>+ Crear</Text>
										</PrimaryButton>
									</View>
								</View>
								<ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
									{grupos.map((grupo) => (
										<Pressable
											key={grupo.id}
											style={styles.card}
											onPress={() =>
												navigation.navigate('DetalleGrupo', {
													grupoId: grupo.id,
													nombreGrupo: grupo.nombre,
													creadorId: grupo.creadorId,
													administradorId: grupo.administradorId,
													materiaId: grupo.materia.id,
													materiaNombre: grupo.materia.nombre,
													miembrosIds: grupo.miembros.map((m: any) => m.id),
												})
											}
										>
											<Text style={styles.groupTitle}>{grupo.nombre}</Text>
											<Text style={styles.groupMateria}>
												Materia: {grupo.materia.nombre}
											</Text>
											<Text style={styles.groupMembers}>
												{grupo.cantidadMiembros}{' '}
												{grupo.cantidadMiembros === 1 ? 'miembro' : 'miembros'}
											</Text>
										</Pressable>
									))}
									{grupos.length === 0 && (
										<Text style={styles.empty}>
											No perteneces a ningún grupo todavía.
										</Text>
									)}
								</ScrollView>
							</View>
						</View>
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
							style={[styles.footerTab, styles.footerTabActive]}
							onPress={() => navigation.navigate('Grupos')}
							accessibilityLabel="Grupos"
						>
							<Ionicons name="people" size={24} style={styles.footerIcon} />
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

				<GruposDisponiblesModal
					visible={gruposDisponiblesModalVisible}
					onClose={() => setGruposDisponiblesModalVisible(false)}
					gruposDisponibles={gruposDisponibles}
					processingGrupoId={processingGrupoId}
					onUnirse={solicitarIngreso}
					loading={loading}
				/>

				<CrearGrupoModal
					visible={crearGrupoModalVisible}
					onClose={() => setCrearGrupoModalVisible(false)}
					onSuccess={handleModalSuccess}
					materiasUsuario={materiasUsuario}
				/>
			</Screen>
		</DesktopSidebar>
	);
}
