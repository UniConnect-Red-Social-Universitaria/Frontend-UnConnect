import { StyleSheet } from "react-native";
import theme from "../styles/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    minHeight: 0,
  },


  contentWrapper: {
    alignItems: "center",
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    width: "100%",
  },



  scrollView: {
    width: "100%",
    flex: 1,
  },

  // HEADER
  header: {
    width: "100%",
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerWithButton: {
    width: "100%",
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  logoImage: {
    width: 50,
    height: 50,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 2,
    color: theme.colors.primary,
  },

  caption: {
    fontSize: 13,
    marginTop: 4,
    color: theme.colors.primaryMid,
  },

  // BANNER OBSERVADOR
  observerBanner: {
    width: "100%",
    backgroundColor: theme.colors.gold,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  observerBannerText: {
    color: theme.colors.primaryDark,
    fontWeight: "600",
    fontSize: 14,
  },

  // FORMULARIO
  formCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#F5F5F5",
    marginBottom: 16,
  },

  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.primary,
    backgroundColor: theme.colors.white,
    marginBottom: 10,
  },

  inputMultiline: {
    minHeight: 84,
    textAlignVertical: "top",
  },

  labelCategoria: {
    fontSize: 13,
    color: theme.colors.primaryMid,
    marginBottom: 6,
    fontWeight: "600",
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  chipScroll: {
    marginBottom: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primaryMid,
    marginRight: 8,
  },

  chipActivo: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  chipText: {
    fontSize: 13,
    color: theme.colors.primaryMid,
  },

  chipTextoActivo: {
    color: theme.colors.white,
    fontWeight: "600",
  },

  filtroSection: {
    width: "100%",
    marginBottom: 12,
  },

  filtroLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 8,
  },

  suscripcionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 8,
  },

  suscripcionLabel: {
    fontSize: 13,
    color: theme.colors.primaryMid,
    flex: 1,
  },

  suscripcionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },

  suscripcionBtnActivo: {
    backgroundColor: "#EAF2FF",
    borderColor: theme.colors.primary,
  },

  suscripcionBtnText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "600",
  },

  suscripcionBtnTextActivo: {
    color: theme.colors.primaryDark,
    fontWeight: "700",
  },

  formMessage: {
    fontSize: 13,
    color: "#E53935",
    marginBottom: 12,
    fontWeight: "bold",
    textAlign: "center",
  },

  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  buttonPressed: {
    opacity: 0.9,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  // LISTA / CARDS
  list: {
    gap: 12,
    paddingBottom: 24,
    alignItems: "stretch",
    width: "100%",
  },

  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#F5F5F5",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
    flex: 1,
  },

  categoriaBadge: {
    backgroundColor: theme.colors.goldLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },

  categoriaBadgeText: {
    fontSize: 11,
    color: theme.colors.primaryDark,
    fontWeight: "600",
  },

  eventDate: {
    fontSize: 14,
    color: theme.colors.primaryMid,
    marginTop: 4,
  },

  eventDescription: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 8,
    lineHeight: 20,
  },

  eventLocation: {
    fontSize: 13,
    color: theme.colors.primaryMid,
    marginTop: 8,
    fontWeight: "600",
  },

  eventAuthor: {
    fontSize: 13,
    color: theme.colors.primaryMid,
    marginTop: 10,
    fontWeight: "500",
  },

  empty: {
    marginTop: 16,
    color: theme.colors.primaryMid,
    textAlign: "center",
  },

  error: {
    color: "#b00020",
    marginBottom: 12,
    textAlign: "center",
  },

  // FOOTER
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingBottom: 48,
    paddingTop: 24,
    width: "100%",
    alignSelf: "stretch",
    minHeight: 80,
  },

  navButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },

  footerTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 999,
  },

  footerTabActive: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },

  navButtonTextActive: {
    fontWeight: "700",
  },

  footerIcon: {
    color: "#ffffff",
  },

  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  createButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
  },

  closeButton: {
    padding: 8,
  },

  closeButtonText: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
});