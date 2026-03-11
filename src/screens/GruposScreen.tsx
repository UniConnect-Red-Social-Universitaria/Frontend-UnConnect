import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import theme from "../styles/theme";
import { styles } from "../styles/GruposScreen.styles";
import { useGrupos } from "../hooks/useGrupos";
import { CrearGrupoModal } from "../components/CrearGrupoModal";

type RootStackParamList = {
  Eventos: undefined;
  Grupos: undefined;
  Login: undefined;
  DetalleGrupo: { grupoId: string; nombreGrupo: string };
};

type GruposScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Grupos"
>;

type GruposScreenProps = {
  navigation: GruposScreenNavigationProp;
};

export function GruposScreen({ navigation }: GruposScreenProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const {
    grupos,
    gruposDisponibles,
    materiasUsuario,
    loading,
    error,
    processingGrupoId,
    unirseAGrupo,
    cargarGrupos,
  } = useGrupos(navigation);

  const handleModalSuccess = async () => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) await cargarGrupos(token);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo-caldas.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>UniConnect</Text>
            <Text style={styles.subtitle}>Mis Grupos</Text>
            <Text style={styles.caption}>Comunidad Universidad de Caldas</Text>
          </View>
        </View>

        {loading && (
          <ActivityIndicator color={theme.colors.primary} size="large" />
        )}
        {error && <Text style={styles.error}>{error}</Text>}

        {!loading && !error && (
          <ScrollView
            contentContainerStyle={styles.list}
            style={styles.scrollView}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionTitle}>Grupos disponibles</Text>
                <Pressable
                  style={styles.createButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.createButtonText}>+ Crear Grupo</Text>
                </Pressable>
              </View>

              {gruposDisponibles.map((grupo) => {
                const botonDeshabilitado =
                  grupo.yaPertenece ||
                  grupo.estaLleno ||
                  processingGrupoId === grupo.id;
                let textoBoton = "Unirme";
                if (grupo.yaPertenece) textoBoton = "Ya eres miembro";
                else if (grupo.estaLleno) textoBoton = "Grupo lleno";
                else if (processingGrupoId === grupo.id)
                  textoBoton = "Uniendome...";

                return (
                  <View key={grupo.id} style={styles.card}>
                    <Text style={styles.groupTitle}>{grupo.nombre}</Text>
                    <Text style={styles.groupMateria}>
                      Materia: {grupo.materia.nombre}
                    </Text>
                    <Text style={styles.groupMembers}>
                      {grupo.cantidadMiembros}/{grupo.maxMiembros} integrantes
                    </Text>
                    <Pressable
                      onPress={() => unirseAGrupo(grupo.id)}
                      disabled={botonDeshabilitado}
                      style={[
                        styles.joinButton,
                        botonDeshabilitado ? styles.joinButtonDisabled : null,
                      ]}
                    >
                      <Text style={styles.joinButtonText}>{textoBoton}</Text>
                    </Pressable>
                  </View>
                );
              })}
              {gruposDisponibles.length === 0 && (
                <Text style={styles.empty}>
                  No hay grupos disponibles por ahora.
                </Text>
              )}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Mis grupos</Text>
              {grupos.map((grupo) => (
                <Pressable
                  key={grupo.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate("DetalleGrupo", {
                      grupoId: grupo.id,
                      nombreGrupo: grupo.nombre,
                    })
                  }
                >
                  <Text style={styles.groupTitle}>{grupo.nombre}</Text>
                  <Text style={styles.groupMateria}>
                    Materia: {grupo.materia.nombre}
                  </Text>
                  <Text style={styles.groupMembers}>
                    {grupo.cantidadMiembros}{" "}
                    {grupo.cantidadMiembros === 1 ? "miembro" : "miembros"}
                  </Text>
                </Pressable>
              ))}
              {grupos.length === 0 && (
                <Text style={styles.empty}>
                  No perteneces a ningún grupo todavía.
                </Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      <Pressable
        style={styles.navButton}
        onPress={() => navigation.navigate("Eventos")}
      >
        <Text style={styles.navButtonText}>Ver Eventos</Text>
      </Pressable>

      <CrearGrupoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        materiasUsuario={materiasUsuario}
      />
    </View>
  );
}
