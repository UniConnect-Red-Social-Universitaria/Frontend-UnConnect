import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { styles } from "../styles/DetalleGrupoScreen.styles";
import { useGrupoArchivos } from "../hooks/useGrupoArchivos";
import { useMiembrosGrupo } from "../hooks/useMiembrosGrupo";
import { AgregarMiembroModal } from "../components/AgregarMiembroModal";

type DetalleGrupoParamList = {
  DetalleGrupo: {
    grupoId: string;
    nombreGrupo: string;
    creadorId: string;
    materiaNombre: string;
    miembrosIds: string[];
  };
  MensajeGrupo: {
    grupoId: string;
    nombreGrupo: string;
    userId?: string | null;
  };
};

type Props = StackScreenProps<DetalleGrupoParamList, "DetalleGrupo">;

export function DetalleGrupoScreen({ route, navigation }: Props) {
  const { grupoId, nombreGrupo, creadorId, materiaNombre, miembrosIds } =
    route.params;

  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const {
    archivos,
    loading,
    uploading,
    downloadingId,
    cargarArchivos,
    subirPdf,
    descargarPdf,
  } = useGrupoArchivos(grupoId);

  const {
    isAdmin,
    candidatos,
    cargandoCandidatos,
    agregando,
    cargarCandidatos,
    agregarMiembro,
  } = useMiembrosGrupo(grupoId, creadorId, materiaNombre, miembrosIds);

  useEffect(() => {
    cargarArchivos();
  }, [cargarArchivos]);

  const archivosFiltrados = archivos.filter((a) =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.groupTitle}>{nombreGrupo}</Text>
        <Text style={styles.groupSubtitle}>Espacio de trabajo del grupo</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("MensajeGrupo", { grupoId, nombreGrupo })
          }
        >
          <Text style={styles.actionButtonText}> Ir al Chat</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.actionButtonSolid]}
          onPress={subirPdf}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.actionButtonSolidText}>Subir PDF</Text>
          )}
        </Pressable>

        {isAdmin && (
          <Pressable
            style={[styles.actionButton, styles.actionButtonSuccess]}
            onPress={() => {
              setModalVisible(true);
              cargarCandidatos();
            }}
          >
            <Text style={styles.actionButtonSolidText}>+ Miembro</Text>
          </Pressable>
        )}
      </View>

      <AgregarMiembroModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        candidatos={candidatos}
        cargandoCandidatos={cargandoCandidatos}
        agregando={agregando}
        onAgregar={(id) => agregarMiembro(id, () => setModalVisible(false))}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar archivo por nombre..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#005b96" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContainer}
          data={archivosFiltrados}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Archivos del grupo</Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {busqueda
                ? "No se encontraron archivos."
                : "Aún no hay archivos en este grupo."}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.fileCard}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.fileMeta}>
                  {formatSize(item.tamanoBytes)} • Subido por{" "}
                  {item.subidoPor?.nombre || "Usuario"}
                </Text>
              </View>

              <Pressable
                style={styles.downloadButton}
                onPress={() => descargarPdf(item.id, item.nombre)}
                disabled={downloadingId === item.id}
              >
                {downloadingId === item.id ? (
                  <ActivityIndicator size="small" color="#005b96" />
                ) : (
                  <Text style={styles.downloadButtonText}>Descargar</Text>
                )}
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
