import { bookingAPI, equipmentAPI, getImageUrl } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [equipment, setEquipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    purpose: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);

  useEffect(() => {
    loadEquipment();
  }, [id]);

  const loadEquipment = async () => {
    try {
      const response = await equipmentAPI.getById(Number(id));
      setEquipment(response.data.equipment);
    } catch (error) {
      console.error("Error loading equipment:", error);
      Alert.alert("Error", "Failed to load equipment details");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await bookingAPI.getAvailableSlots(Number(id), dateStr);
      setBookedSlots(response.data.bookedSlots);
    } catch (error) {
      console.error("Error loading slots:", error);
    }
  };

  const handleBookNow = () => {
    if (equipment?.status !== "available") {
      Alert.alert("Unavailable", "This equipment is not available for booking");
      return;
    }
    loadAvailableSlots(bookingData.date);
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async () => {
    if (!bookingData.purpose.trim()) {
      Alert.alert("Required", "Please enter the purpose of booking");
      return;
    }

    if (bookingData.startTime >= bookingData.endTime) {
      Alert.alert("Invalid Time", "End time must be after start time");
      return;
    }

    setIsSubmitting(true);
    try {
      const formatDateIST = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const payload = {
        equipment_id: Number(id),
        booking_date: formatDateIST(bookingData.date),
        start_time: format(bookingData.startTime, "HH:mm"),
        end_time: format(bookingData.endTime, "HH:mm"),
        purpose: bookingData.purpose.trim(),
      };

      console.log(" Booking payload:", payload);

      await bookingAPI.create(payload);

      Alert.alert("Success", "Booking request submitted successfully", [
        {
          text: "OK",
          onPress: () => {
            setShowBookingModal(false);
            router.push("/(tabs)/bookings");
          },
        },
      ]);
    } catch (error: any) {
      console.error("Booking error:", error.response?.data || error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create booking"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "#4caf50";
      case "in_use":
        return "#ff9800";
      case "maintenance":
        return "#E53935";
      default:
        return "#9e9e9e";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return "checkmark-circle";
      case "in_use":
        return "time";
      case "maintenance":
        return "construct";
      default:
        return "help-circle";
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#26CCC2" />
      </View>
    );
  }

  if (!equipment) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#E53935" />
        <Text style={styles.errorText}>Equipment not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ================= FIXED HEADER ================= */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Equipment Details
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 88 }}
      >
        {/* Header Image */}
        {equipment.equipment_image ? (
          <Image
            source={{ uri: getImageUrl(equipment.equipment_image)! }}
            style={styles.headerImage}
          />
        ) : (
          <View style={styles.headerImagePlaceholder}>
            <Ionicons name="flask" size={80} color="#ccc" />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(equipment.status) + "20" },
              ]}
            >
              <Ionicons
                name={getStatusIcon(equipment.status)}
                size={16}
                color={getStatusColor(equipment.status)}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(equipment.status) },
                ]}
              >
                {equipment.status.replace("_", " ").toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{equipment.name}</Text>
          <View style={styles.typeContainer}>
            <Ionicons name="pricetag-outline" size={18} color="#26CCC2" />
            <Text style={styles.type}>{equipment.type}</Text>
          </View>

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>

            <View style={styles.detailsCard}>
              {equipment.model_number && (
                <View style={styles.detailRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="cube-outline" size={20} color="#26CCC2" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Model Number</Text>
                    <Text style={styles.detailValue}>
                      {equipment.model_number}
                    </Text>
                  </View>
                </View>
              )}

              {equipment.serial_number && (
                <View style={styles.detailRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="barcode-outline"
                      size={20}
                      color="#26CCC2"
                    />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Serial Number</Text>
                    <Text style={styles.detailValue}>
                      {equipment.serial_number}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {equipment.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.descriptionCard}>
                <Text style={styles.description}>{equipment.description}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            equipment.status !== "available" && styles.bookButtonDisabled,
          ]}
          onPress={handleBookNow}
          disabled={equipment.status !== "available"}
        >
          <Ionicons name="calendar" size={22} color="#fff" />
          <Text style={styles.bookButtonText}>
            {equipment.status === "available" ? "Book Now" : "Not Available"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Booking Modal */}
      <Modal visible={showBookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Equipment</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Date Picker */}
              <Text style={styles.inputLabel}>Select Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.dateIconContainer}>
                  <Ionicons name="calendar-outline" size={22} color="#26CCC2" />
                </View>
                <Text style={styles.dateButtonText}>
                  {format(bookingData.date, "EEEE, MMM dd, yyyy")}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={bookingData.date}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setBookingData({ ...bookingData, date });
                      loadAvailableSlots(date);
                    }
                  }}
                />
              )}

              {/* Display booked slots */}
              {bookedSlots.length > 0 && (
                <View style={styles.bookedSlotsContainer}>
                  <View style={styles.bookedSlotsHeader}>
                    <Ionicons name="warning" size={20} color="#ff6b6b" />
                    <Text style={styles.bookedSlotsTitle}>
                      Already Booked Slots
                    </Text>
                  </View>
                  <View style={styles.slotsGrid}>
                    {bookedSlots.map((slot, index) => (
                      <View key={index} style={styles.bookedSlot}>
                        <Ionicons name="time" size={14} color="#ff6b6b" />
                        <Text style={styles.bookedSlotText}>
                          {slot.start_time} - {slot.end_time}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Time Selection Section */}
              <View style={styles.timeSection}>
                <Text style={styles.inputLabel}>Select Time Slot</Text>

                <View style={styles.timeRow}>
                  {/* Start Time */}
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>From</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#26CCC2" />
                      <Text style={styles.timeButtonText}>
                        {format(bookingData.startTime, "hh:mm a")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Arrow */}
                  <View style={styles.arrowContainer}>
                    <Ionicons name="arrow-forward" size={20} color="#26CCC2" />
                  </View>

                  {/* End Time */}
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>To</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowEndTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#26CCC2" />
                      <Text style={styles.timeButtonText}>
                        {format(bookingData.endTime, "hh:mm a")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {showStartTimePicker && (
                <DateTimePicker
                  value={bookingData.startTime}
                  mode="time"
                  onChange={(event, time) => {
                    setShowStartTimePicker(false);
                    if (time)
                      setBookingData({ ...bookingData, startTime: time });
                  }}
                />
              )}

              {showEndTimePicker && (
                <DateTimePicker
                  value={bookingData.endTime}
                  mode="time"
                  onChange={(event, time) => {
                    setShowEndTimePicker(false);
                    if (time) setBookingData({ ...bookingData, endTime: time });
                  }}
                />
              )}

              {/* Purpose */}
              <Text style={styles.inputLabel}>Purpose of Booking</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe why you need this equipment..."
                placeholderTextColor="#000000ff"
                value={bookingData.purpose}
                onChangeText={(text) =>
                  setBookingData({ ...bookingData, purpose: text })
                }
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBookingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitBooking}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#26CCC2",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerImage: {
    height: 300,
    // backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginTop: 30,
    marginBottom: 20,
    marginLeft: 16,
    marginRight: 16,
    shadowColor: "#000000ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  headerImagePlaceholder: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  type: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6f9f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },

  detailValue: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "600",
  },

  descriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
    textAlign: "justify",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  bookButton: {
    flexDirection: "row",
    backgroundColor: "#26CCC2",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#26CCC2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonDisabled: {
    backgroundColor: "#bdbdbd",
    shadowOpacity: 0,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "93%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 12,
    marginTop: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    gap: 12,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f9f7",
    justifyContent: "center",
    alignItems: "center",
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
    fontWeight: "600",
  },
  bookedSlotsContainer: {
    backgroundColor: "#fff5f5",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ffe0e0",
  },
  bookedSlotsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  bookedSlotsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ff6b6b",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bookedSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffcccb",
  },
  bookedSlotText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  timeSection: {
    marginTop: 20,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 8,
    fontWeight: "600",
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    gap: 10,
    justifyContent: "center",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "700",
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f9f7",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    color: "#212121",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "700",
  },
  submitButton: {
    flex: 2,
    height: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#26CCC2",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#90caf9",
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
