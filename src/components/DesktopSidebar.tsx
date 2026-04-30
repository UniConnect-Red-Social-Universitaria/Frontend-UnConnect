import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { authService } from '../services';
import { showToast } from '../utils/toast';
import { getUnreadNotificationsCount, subscribeUnreadNotificationsCount } from '../services/notificaciones-badge.service';
import { useFocusEffect } from '@react-navigation/native';

type ActiveScreen = 'Principal' | 'Grupos' | 'Eventos' | 'Contactos' | 'Notificaciones' | 'EditarPerfil' | null;

type Props = {
    navigation: any;
    activeScreen?: ActiveScreen;
    children: React.ReactNode;
};

const NAV_ITEMS = [
    { screen: 'Principal', label: 'Inicio', icon: 'home-outline', iconActive: 'home' },
    { screen: 'Grupos', label: 'Grupos', icon: 'people-outline', iconActive: 'people' },
    { screen: 'Eventos', label: 'Eventos', icon: 'calendar-outline', iconActive: 'calendar' },
    { screen: 'Contactos', label: 'Contactos', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
    { screen: 'Notificaciones', label: 'Notificaciones', icon: 'notifications-outline', iconActive: 'notifications' },
    { screen: 'EditarPerfil', label: 'Perfil', icon: 'person-circle-outline', iconActive: 'person-circle' },
] as const;

export function DesktopSidebar({ navigation, activeScreen, children }: Props) {
    const [unreadNotifications, setUnreadNotifications] = React.useState(0);
    const isDesktop = useIsDesktop();
    // useWindowDimensions gives us real pixel viewport dimensions.
    // We apply these explicitly so the layout does NOT depend on any
    // flex:1 chain — React Navigation wrappers break that chain on web.
    const { width, height } = useWindowDimensions();

    useFocusEffect(
        React.useCallback(() => {
            let mounted = true;

            void getUnreadNotificationsCount().then((count) => {
                if (mounted) {
                    setUnreadNotifications(count);
                }
            });

            const unsubscribe = subscribeUnreadNotificationsCount((count) => {
                if (mounted) {
                    setUnreadNotifications(count);
                }
            });

            return () => {
                mounted = false;
                unsubscribe();
            };
        }, [])
    );

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch {
            showToast.error('Error al cerrar sesión');
        }
    };

    // On mobile web (width < 768), render a bounded wrapper so ScrollView
    // has explicit pixel dimensions and the bottom bar stays visible.
    if (!isDesktop) {
        return (
            <View style={{ width, height, overflow: 'hidden' }}>
                {children}
            </View>
        );
    }

    const SIDEBAR_WIDTH = 220;
    const contentWidth = width - SIDEBAR_WIDTH;

    return (
        <View style={[styles.container, { width, height }]}>
            <View style={[styles.sidebar, { width: SIDEBAR_WIDTH, height }]}>
                <Image
                    source={require('../../assets/images/logo-caldas.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.brand}>UniConnect</Text>

                <View style={styles.nav}>
                    {NAV_ITEMS.map(({ screen, label, icon, iconActive }) => {
                        const isActive = activeScreen === screen;
                        const showBadge = screen === 'Notificaciones' && unreadNotifications > 0;
                        return (
                            <Pressable
                                key={screen}
                                style={[styles.navItem, isActive && styles.navItemActive]}
                                onPress={() => navigation.navigate(screen)}
                            >
                                <View style={styles.navIconWrap}>
                                    <Ionicons
                                        name={isActive ? iconActive : icon}
                                        size={20}
                                        color={isActive ? '#007AFF' : '#555'}
                                    />
                                    {showBadge && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>
                                                {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                    {label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable style={styles.logout} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#fff" />
                    <Text style={styles.logoutText}>Salir</Text>
                </Pressable>
            </View>

            {/* Content area: explicit pixel width AND height so ScrollView inside can scroll */}
            <View style={[styles.content, { width: contentWidth, height }]}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#f0f4f8',
        overflow: 'hidden',
    },
    sidebar: {
        backgroundColor: '#ffffff',
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
        paddingTop: 32,
        paddingHorizontal: 16,
        paddingBottom: 24,
        justifyContent: 'space-between',
    },
    logo: {
        width: 120,
        height: 48,
        alignSelf: 'center',
        marginBottom: 8,
    },
    brand: {
        fontSize: 18,
        fontWeight: '700',
        color: '#003d70',
        textAlign: 'center',
        marginBottom: 32,
    },
    nav: {
        flex: 1,
        gap: 4,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    navItemActive: {
        backgroundColor: '#EBF3FF',
    },
    navIconWrap: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#E53935',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    navLabel: {
        fontSize: 15,
        color: '#444',
        fontWeight: '500',
    },
    navLabelActive: {
        color: '#007AFF',
        fontWeight: '700',
    },
    logout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#003d70',
        borderRadius: 10,
        paddingVertical: 12,
        marginTop: 16,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    content: {
        backgroundColor: '#f0f4f8',
        overflow: 'hidden',
    },
});
