import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { PerfilCard } from "../components/PerfilCard";

/**
 * Pantalla de vista de perfil de usuario
 * Demuestra el uso del componente PerfilCard con expansión condicional
 */
export default function VistaPerfilScreen() {
  const [usuarioIdInput, setUsuarioIdInput] = useState("usuario-001");
  const [mostrarPerfil, setMostrarPerfil] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {!mostrarPerfil ? (
          <View style={styles.inputContainer}>
            <Text style={styles.title}>Vista de Perfil del Usuario</Text>
            <Text style={styles.subtitle}>
              Ingresa el ID del usuario para visualizar su perfil
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>ID del Usuario:</Text>
              <View style={styles.input}>
                <Text style={styles.inputText}>{usuarioIdInput}</Text>
              </View>
            </View>

            <Text style={styles.description}>
              📌 El componente cargará automáticamente el perfil base (público, sin
              costo)
            </Text>
            <Text style={styles.description}>
              📌 El usuario puede hacer clic en "Ver Estadísticas" para expandir y
              cargar datos enriquecidos
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setMostrarPerfil(true)}
            >
              <Text style={styles.buttonText}>Ver Perfil</Text>
            </TouchableOpacity>

            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>IDs de Ejemplo:</Text>
              {["usuario-001", "usuario-002", "usuario-003"].map((id) => (
                <TouchableOpacity
                  key={id}
                  style={styles.exampleButton}
                  onPress={() => {
                    setUsuarioIdInput(id);
                  }}
                >
                  <Text style={styles.exampleButtonText}>{id}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <PerfilCard
            usuarioId={usuarioIdInput}
            onClose={() => setMostrarPerfil(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  inputContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  inputText: {
    fontSize: 14,
    color: "#1f2937",
  },
  description: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  examplesContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  exampleButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  exampleButtonText: {
    fontSize: 13,
    color: "#6b7280",
  },
});
