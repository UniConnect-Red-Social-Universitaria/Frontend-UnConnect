import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
export default function LoginScreen() {
  const { user, error, loading, request, signIn, signOut } = useGoogleAuth();
  if (user) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: user.picture }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Universidad de Caldas</Text>
      <Text style={styles.subtitle}>
        Inicia sesión con tu cuenta institucional
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color="#004A8F" />
      ) : (
        <TouchableOpacity
          style={[styles.googleBtn, !request && styles.disabled]}
          onPress={signIn}
          disabled={!request}
        >
          <Text style={styles.googleText}>Iniciar sesión con Google</Text>
          <Text style={styles.domain}>@ucaldas.edu.co</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004A8F",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  googleBtn: {
    backgroundColor: "#004A8F",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: "center",
  },
  googleText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  domain: { color: "#a8c8f0", fontSize: 12, marginTop: 4 },
  disabled: { opacity: 0.5 },
  error: { color: "red", marginBottom: 16, textAlign: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "bold", color: "#333" },
  email: { fontSize: 14, color: "#004A8F", marginBottom: 24 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#004A8F",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutText: { color: "#004A8F", fontWeight: "600" },
});
