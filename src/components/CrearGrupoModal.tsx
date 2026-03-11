import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles/GruposScreen.styles";
import { resolverApiBaseUrl } from "../utils/apiConfig";
import { Materia } from "../hooks/useGrupos";

type CrearGrupoModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materiasUsuario: Materia[];
};

const AUTH_TOKEN_STORAGE_KEY = "userToken";

export function CrearGrupoModal({
  visible,
  onClose,
  onSuccess,
  materiasUsuario,
}: CrearGrupoModalProps) {
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState("");
  const [nuevaMateriaId, setNuevaMateriaId] = useState("");
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState<string | null>(null);

  const apiBaseUrl = resolverApiBaseUrl();

  const handleCrearGrupo = async () => {
    setErrorCreacion(null);
    if (!nuevoGrupoNombre.trim() || !nuevaMateriaId) {
      setErrorCreacion(
        "Debes ingresar el nombre del grupo y seleccionar una materia.",
      );
      return;
    }

    setCreandoGrupo(true);
    try {
      const tokenGuardado = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (!tokenGuardado) throw new Error("No hay sesión activa.");

      const response = await fetch(`${apiBaseUrl}/api/grupos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenGuardado.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nuevoGrupoNombre.trim(),
          materiaId: nuevaMateriaId,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setErrorCreacion(payload.message || "No se pudo crear el grupo");
        return;
      }

      limpiarYProcesarExito();
    } catch (err) {
      setErrorCreacion(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al conectar.",
      );
    } finally {
      setCreandoGrupo(false);
    }
  };

  const limpiarYProcesarExito = () => {
    setNuevoGrupoNombre("");
    setNuevaMateriaId("");
    setErrorCreacion(null);
    onClose();
    onSuccess();
    Alert.alert("Éxito", "Grupo creado correctamente");
  };

  const cancelar = () => {
    setNuevoGrupoNombre("");
    setNuevaMateriaId("");
    setErrorCreacion(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={() => Keyboard.dismiss()}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Crear Nuevo Grupo</Text>

          {errorCreacion && (
            <Text style={styles.errorCreacionText}>{errorCreacion}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Nombre del Grupo (Ej: Grupo Estudio Cálculo)"
            value={nuevoGrupoNombre}
            onChangeText={(text) => {
              setNuevoGrupoNombre(text);
              if (errorCreacion) setErrorCreacion(null);
            }}
          />

          <Text style={styles.modalSubtitle}>Selecciona la materia:</Text>

          <View style={styles.materiasContainer}>
            {materiasUsuario.length > 0 ? (
              materiasUsuario.map((materia) => (
                <Pressable
                  key={materia.id}
                  onPress={() => {
                    setNuevaMateriaId(materia.id);
                    if (errorCreacion) setErrorCreacion(null);
                  }}
                  style={[
                    styles.materiaChip,
                    nuevaMateriaId === materia.id && styles.materiaChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.materiaChipText,
                      nuevaMateriaId === materia.id &&
                        styles.materiaChipTextSelected,
                    ]}
                  >
                    {materia.nombre}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyMateriasText}>
                No estás inscrito en ninguna materia en tu perfil.
              </Text>
            )}
          </View>

          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={cancelar}
            >
              <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.modalButtonSubmit]}
              onPress={handleCrearGrupo}
              disabled={creandoGrupo}
            >
              {creandoGrupo ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.modalButtonTextSubmit}>Crear</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
