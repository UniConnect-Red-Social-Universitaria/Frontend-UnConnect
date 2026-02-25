import React from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import globalStyles from "../styles/global";
import { styles } from "./PrincipalScreenStyles";

type RootStackParamList = {
  Principal: undefined;
  Grupos: undefined;
  Eventos: undefined;
  Contactos: undefined;
};

type PrincipalScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Principal"
>;

export default function PrincipalScreen({
  navigation,
}: {
  navigation: PrincipalScreenNavigationProp;
}) {
  const handleLogout = () => {
    console.log("Cerrar sesión");
  };

  return (
    <View style={[globalStyles.container || {}, styles.container]}>
      {/* 1. HEADER (Top) */}
      <View style={styles.header}>
        <Text style={styles.brand}>UniConnect</Text>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={styles.logoutText}>Salir</Text>
        </Pressable>
      </View>

      {/* 2. MAIN CONTENT (Middle) */}
      <View style={styles.mainContent}>
        <Text style={styles.greeting}>¡Hola!</Text>
        <Text style={styles.subtitle}>
          Encuentra tu comunidad en la universidad
        </Text>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Buscar compañeros, grupos o eventos..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>RESULTADOS RECIENTES</Text>
          <Text style={{ color: "#CCC", fontStyle: "italic", marginTop: 10 }}>
            Sin búsquedas recientes...
          </Text>
        </View>
      </View>

      {/* 3. BOTTOM BAR*/}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => navigation.navigate("Grupos")}
        >
          <Text style={styles.navButtonText}>Grupos</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => navigation.navigate("Eventos")}
        >
          <Text style={styles.navButtonText}>Eventos</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => console.log("Ir a Contactos (Próximamente)")}
        >
          <Text style={styles.navButtonText}>Contactos</Text>
        </Pressable>
      </View>
    </View>
  );
}
