import React from "react";
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  FlatList,
  Pressable,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  candidatos: any[];
  cargandoCandidatos: boolean;
  agregando: boolean;
  onAgregar: (usuarioId: string) => void;
}

export function AgregarMiembroModal({
  visible,
  onClose,
  candidatos,
  cargandoCandidatos,
  agregando,
  onAgregar,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 10,
            width: "90%",
            maxHeight: "80%",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15 }}>
            Compañeros disponibles
          </Text>

          {cargandoCandidatos ? (
            <ActivityIndicator
              size="large"
              color="#005b96"
              style={{ marginVertical: 20 }}
            />
          ) : (
            <FlatList
              data={candidatos}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    color: "#666",
                    marginVertical: 20,
                  }}
                >
                  No hay más compañeros cursando esta materia o todos ya están
                  en un grupo.
                </Text>
              }
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#eee",
                  }}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                      {item.nombre} {item.apellido}
                    </Text>
                    {item.correo && (
                      <Text style={{ fontSize: 12, color: "#666" }}>
                        {item.correo}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    onPress={() => onAgregar(item.id)}
                    disabled={agregando}
                    style={{
                      backgroundColor: "#005b96",
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      borderRadius: 5,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 14,
                      }}
                    >
                      Agregar
                    </Text>
                  </Pressable>
                </View>
              )}
            />
          )}

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 20,
              padding: 12,
              alignItems: "center",
              backgroundColor: "#f5f5f5",
              borderRadius: 8,
            }}
          >
            <Text
              style={{ color: "#d9534f", fontWeight: "bold", fontSize: 16 }}
            >
              Cerrar
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
