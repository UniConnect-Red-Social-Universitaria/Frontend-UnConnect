import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { usePerfil } from "../hooks/usePerfil";
import { Insignia } from "../types/api.types";

interface PerfilCardProps {
  usuarioId: string;
  onClose?: () => void;
}

const INSIGNIA_EMOJIS: Record<Insignia, string> = {
  fundador: "🏆",
  "participante-activo": "🔥",
  comunicador: "💬",
  colaborador: "🤝",
};

const INSIGNIA_LABELS: Record<Insignia, string> = {
  fundador: "Fundador",
  "participante-activo": "Participante Activo",
  comunicador: "Comunicador",
  colaborador: "Colaborador",
};

/**
 * Tarjeta de perfil con expansión condicional
 * 
 * Características:
 * - Muestra perfil base siempre (sin costo)
 * - Carga datos enriquecidos bajo demanda
 * - Muestra insignias con indicadores visuales
 * - Maneja errores y estados de carga
 */
export const PerfilCard: React.FC<PerfilCardProps> = ({ usuarioId, onClose }) => {
  const {
    perfilBase,
    perfilEnriquecido,
    cargandoBase,
    cargandoEnriquecido,
    expandido,
    errorBase,
    errorEnriquecido,
    cargarPerfilBase,
    expandirPerfil,
    contraerPerfil,
  } = usePerfil();

  // Cargar perfil base al montar el componente
  useEffect(() => {
    cargarPerfilBase(usuarioId);
  }, [usuarioId, cargarPerfilBase]);

  // Estado: Cargando perfil base
  if (cargandoBase) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </View>
    );
  }

  // Estado: Error al cargar perfil base
  if (errorBase) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{errorBase}</Text>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Estado: Sin datos
  if (!perfilBase) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No se encontró el perfil</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Header con nombre */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {perfilBase.nombre[0]}{perfilBase.apellido[0]}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.nombre}>
              {perfilBase.nombre} {perfilBase.apellido}
            </Text>
            <Text style={styles.carrera}>{perfilBase.carrera}</Text>
            {perfilBase.semestre && (
              <Text style={styles.semestre}>Semestre {perfilBase.semestre}</Text>
            )}
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Asignaturas activas */}
        {perfilBase.asignaturasActivas && perfilBase.asignaturasActivas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asignaturas Activas</Text>
            <View style={styles.asignaturasContainer}>
              {perfilBase.asignaturasActivas.map((asignatura, index) => (
                <View key={index} style={styles.asignaturaBadge}>
                  <Text style={styles.asignaturaBadgeText}>{asignatura}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Botón de expansión */}
        {!expandido && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => expandirPerfil(usuarioId)}
            disabled={cargandoEnriquecido}
          >
            {cargandoEnriquecido ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.expandButtonText}>Cargando...</Text>
              </>
            ) : (
              <>
                <Text style={styles.expandButtonText}>Ver Estadísticas</Text>
                <Text style={styles.expandButtonIcon}>→</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Sección expandida: Estadísticas e Insignias */}
        {expandido && perfilEnriquecido && (
          <>
            {/* Estadísticas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estadísticas</Text>
              <View style={styles.estadisticasGrid}>
                <View style={styles.estadisticaCard}>
                  <Text style={styles.estadisticaValor}>
                    {perfilEnriquecido.estadisticas.gruposCreados}
                  </Text>
                  <Text style={styles.estadisticaLabel}>Grupos Creados</Text>
                </View>
                <View style={styles.estadisticaCard}>
                  <Text style={styles.estadisticaValor}>
                    {perfilEnriquecido.estadisticas.gruposParticipa}
                  </Text>
                  <Text style={styles.estadisticaLabel}>Participa En</Text>
                </View>
                <View style={styles.estadisticaCard}>
                  <Text style={styles.estadisticaValor}>
                    {perfilEnriquecido.estadisticas.mensajesEnviados}
                  </Text>
                  <Text style={styles.estadisticaLabel}>Mensajes</Text>
                </View>
              </View>
            </View>

            {/* Insignias */}
            {perfilEnriquecido.insignias && perfilEnriquecido.insignias.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Insignias Desbloqueadas</Text>
                <View style={styles.insigniasContainer}>
                  {perfilEnriquecido.insignias.map((insignia) => (
                    <View key={insignia} style={styles.insigniaCard}>
                      <Text style={styles.insigniaEmoji}>
                        {INSIGNIA_EMOJIS[insignia]}
                      </Text>
                      <Text style={styles.insigniaLabel}>
                        {INSIGNIA_LABELS[insignia]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Error al cargar enriquecido */}
            {errorEnriquecido && (
              <View style={styles.errorInline}>
                <Text style={styles.errorInlineText}>
                  ⚠️ {errorEnriquecido}
                </Text>
              </View>
            )}

            {/* Botón para contraer */}
            <TouchableOpacity
              style={styles.contraerButton}
              onPress={contraerPerfil}
            >
              <Text style={styles.contraerButtonText}>Contraer</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#991b1b",
    marginBottom: 12,
  },
  errorInline: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  errorInlineText: {
    color: "#92400e",
    fontSize: 13,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#dc2626",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "600",
  },
  closeIconButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: "#999",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerInfo: {
    flex: 1,
  },
  nombre: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  carrera: {
    fontSize: 14,
    color: "#6366f1",
    marginBottom: 2,
  },
  semestre: {
    fontSize: 12,
    color: "#999",
  },
  section: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  asignaturasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  asignaturaBadge: {
    backgroundColor: "#ecfdf5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  asignaturaBadgeText: {
    fontSize: 12,
    color: "#047857",
    fontWeight: "500",
  },
  expandButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  expandButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  expandButtonIcon: {
    color: "white",
    fontSize: 16,
  },
  estadisticasGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  estadisticaCard: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  estadisticaValor: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 4,
  },
  estadisticaLabel: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
  insigniasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  insigniaCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fef3c7",
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  insigniaEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  insigniaLabel: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "600",
    textAlign: "center",
  },
  contraerButton: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  contraerButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
});
