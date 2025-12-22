import { bookingAPI, equipmentAPI } from "@/lib/api";
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

  const handleBookNow = () => {
    if (equipment?.status !== "available") {
      Alert.alert("Unavailable", "This equipment is not available for booking");
      return;
    }
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async () => {
    if (!bookingData.purpose.trim()) {
      Alert.alert("Required", "Please enter the purpose of booking");
      return;
    }

    // Validate times
    if (bookingData.startTime >= bookingData.endTime) {
      Alert.alert("Invalid Time", "End time must be after start time");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        equipment_id: Number(id),
        booking_date: format(bookingData.date, "yyyy-MM-dd"),
        start_time: format(bookingData.startTime, "HH:mm"),
        end_time: format(bookingData.endTime, "HH:mm"),
        purpose: bookingData.purpose.trim(),
      };

      console.log("Booking payload:", payload); // DEBUG

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
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!equipment) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>Equipment not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header Image */}
        {equipment.equipment_image ? (
          <Image
            source={{
              uri: `http://10.75.127.122:5000/${equipment.equipment_image}`,
            }}
            style={styles.headerImage}
          />
        ) : (
          <View style={styles.headerImagePlaceholder}>
            <Ionicons name="flask" size={80} color="#ccc" />
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButtonOverlay}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(equipment.status) },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {equipment.status.replace("_", " ").toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{equipment.name}</Text>
          <Text style={styles.type}>{equipment.type}</Text>

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>

            {equipment.model_number && (
              <View style={styles.detailRow}>
                <Ionicons name="cube-outline" size={20} color="#666" />
                <Text style={styles.detailLabel}>Model:</Text>
                <Text style={styles.detailValue}>{equipment.model_number}</Text>
              </View>
            )}

            {equipment.serial_number && (
              <View style={styles.detailRow}>
                <Ionicons name="barcode-outline" size={20} color="#666" />
                <Text style={styles.detailLabel}>Serial:</Text>
                <Text style={styles.detailValue}>
                  {equipment.serial_number}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {equipment.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{equipment.description}</Text>
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
          <Ionicons name="calendar" size={20} color="#fff" />
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
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Date Picker */}
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {format(bookingData.date, "MMM dd, yyyy")}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={bookingData.date}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setBookingData({ ...bookingData, date });
                  }}
                />
              )}

              {/* Start Time */}
              <Text style={styles.inputLabel}>Start Time</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {format(bookingData.startTime, "hh:mm a")}
                </Text>
              </TouchableOpacity>

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

              {/* End Time */}
              <Text style={styles.inputLabel}>End Time</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {format(bookingData.endTime, "hh:mm a")}
                </Text>
              </TouchableOpacity>

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
              <Text style={styles.inputLabel}>Purpose</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter purpose of booking..."
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
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Text>
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
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#2196F3",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
  },
  headerImagePlaceholder: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonOverlay: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  type: {
    fontSize: 18,
    color: "#666",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  bookButton: {
    flexDirection: "row",
    backgroundColor: "#2196F3",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  bookButtonDisabled: {
    backgroundColor: "#bdbdbd",
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
    marginTop: 16,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#212121",
  },
  textArea: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#2196F3",
  },
  submitButtonDisabled: {
    backgroundColor: "#90caf9",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
