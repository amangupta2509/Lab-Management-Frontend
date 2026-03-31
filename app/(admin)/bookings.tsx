import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform } from "react-native";
import { bookingAPI } from "@/lib/api";
import { format } from "date-fns";

interface Booking {
  id: number;
  user_name: string;
  user_email: string;
  equipment_name: string;
  equipment_type: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  remarks?: string;
  created_at: string;
}

export default function AdminBookingsScreen() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadBookings = async () => {
    try {
      // Always fetch all bookings
      const response = await bookingAPI.getAll({});
      setAllBookings(response.data.bookings);

      // Filter based on current tab
      if (filterStatus === "all") {
        setFilteredBookings(response.data.bookings);
      } else {
        setFilteredBookings(
          response.data.bookings.filter(
            (b: Booking) => b.status === filterStatus
          )
        );
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [filterStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const openReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setRemarks(booking.remarks || "");
    setShowReviewModal(true);
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    try {
      await bookingAPI.approve(selectedBooking.id, remarks);
      Alert.alert("Success", "Booking approved successfully");
      setShowReviewModal(false);
      setSelectedBooking(null);
      setRemarks("");
      loadBookings();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to approve booking"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;

    if (!remarks.trim()) {
      Alert.alert("Required", "Please provide a reason for rejection");
      return;
    }

    Alert.alert(
      "Reject Booking",
      "Are you sure you want to reject this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true);
            try {
              await bookingAPI.reject(selectedBooking.id, remarks);
              Alert.alert("Success", "Booking rejected");
              setShowReviewModal(false);
              setSelectedBooking(null);
              setRemarks("");
              loadBookings();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to reject booking"
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return { bg: "#e8f5e9", text: "#4caf50" };
      case "pending":
        return { bg: "#fff3e0", text: "#ff9800" };
      case "rejected":
        return { bg: "#ffebee", text: "#f44336" };
      case "cancelled":
        return { bg: "#f5f5f5", text: "#9e9e9e" };
      case "completed":
        return { bg: "#e3f2fd", text: "#2196F3" };
      default:
        return { bg: "#f5f5f5", text: "#9e9e9e" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "rejected":
        return "close-circle";
      case "cancelled":
        return "ban";
      case "completed":
        return "checkmark-done-circle";
      default:
        return "help-circle";
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const statusColors = getStatusColor(item.status);
    const isPending = item.status === "pending";

    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.userEmail}>{item.user_email}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
          >
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={14}
              color={statusColors.text}
            />
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.equipmentInfo}>
          <Ionicons name="flask" size={20} color="#E53935" />
          <View style={styles.equipmentDetails}>
            <Text style={styles.equipmentName}>{item.equipment_name}</Text>
            <Text style={styles.equipmentType}>{item.equipment_type}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {format(new Date(item.booking_date), "MMM dd, yyyy")}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.start_time} - {item.end_time}
            </Text>
          </View>
          {item.purpose && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={2}>
                {item.purpose}
              </Text>
            </View>
          )}
        </View>

        {item.remarks && (
          <View style={styles.remarksContainer}>
            <Text style={styles.remarksLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        )}

        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => {
                setSelectedBooking(item);
                setRemarks("");
                Alert.alert(
                  "Reject Booking",
                  "Provide a reason for rejection",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Continue",
                      onPress: () => openReviewModal(item),
                    },
                  ],
                  { cancelable: true }
                );
              }}
            >
              <Ionicons name="close-circle-outline" size={16} color="#f44336" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => openReviewModal(item)}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color="#000000ff"
              />
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {["all", "pending", "approved", "rejected"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                filterStatus === status && styles.filterTabActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterStatus === status && styles.filterTextActive,
                ]}
              >
                {status === "all"
                  ? "All"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              {status === "pending" && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {allBookings.filter((b) => b.status === "pending").length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No bookings found</Text>
          </View>
        }
      />

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Review Booking</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowReviewModal(false);
                    setSelectedBooking(null);
                    setRemarks("");
                  }}
                >
                  <Ionicons name="close" size={24} color="#212121" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 120 }}
              >
                {selectedBooking && (
                  <>
                    <View style={styles.bookingDetails}>
                      <Text style={styles.detailLabel}>User:</Text>
                      <Text style={styles.detailValue}>
                        {selectedBooking.user_name}
                      </Text>
                    </View>

                    <View style={styles.bookingDetails}>
                      <Text style={styles.detailLabel}>Equipment:</Text>
                      <Text style={styles.detailValue}>
                        {selectedBooking.equipment_name}
                      </Text>
                    </View>

                    <View style={styles.bookingDetails}>
                      <Text style={styles.detailLabel}>Date & Time:</Text>
                      <Text style={styles.detailValue}>
                        {format(
                          new Date(selectedBooking.booking_date),
                          "MMM dd, yyyy"
                        )}{" "}
                        | {selectedBooking.start_time} -{" "}
                        {selectedBooking.end_time}
                      </Text>
                    </View>

                    {selectedBooking.purpose && (
                      <View style={styles.bookingDetails}>
                        <Text style={styles.detailLabel}>Purpose:</Text>
                        <Text style={styles.detailValue}>
                          {selectedBooking.purpose}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.inputLabel}>Remarks (Optional)</Text>
                    <TextInput
                      style={styles.textArea}
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Add remarks or approval conditions..."
                      multiline
                      placeholderTextColor="#000000ff"
                      numberOfLines={4}
                    />
                  </>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalRejectButton,
                    isProcessing && styles.buttonDisabled,
                  ]}
                  onPress={handleReject}
                  disabled={isProcessing}
                >
                  <Text style={styles.modalRejectButtonText}>
                    {isProcessing ? "Processing..." : "Reject"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalApproveButton,
                    isProcessing && styles.buttonDisabled,
                  ]}
                  onPress={handleApprove}
                  disabled={isProcessing}
                >
                  <Text style={styles.modalApproveButtonText}>
                    {isProcessing ? "Processing..." : "Approve"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: "center",
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: "#E53935",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#ff9800",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  equipmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  equipmentDetails: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  equipmentType: {
    fontSize: 14,
    color: "#666",
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  remarksContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 14,
    color: "#212121",
  },
  actions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  rejectButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E53935",
  },
  rejectButtonText: {
    fontSize: 14,
    color: "#E53935",
    fontWeight: "600",
  },
  approveButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#000000",
  },

  approveButtonText: {
    fontSize: 14,
    color: "#000000ff",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
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
  bookingDetails: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#212121",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
    marginTop: 8,
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
  modalButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  modalRejectButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E53935",
  },
  modalRejectButtonText: {
    fontSize: 16,
    color: "#E53935",
    fontWeight: "600",
  },
  modalApproveButton: {
    backgroundColor: "#ffffffff",
    borderWidth: 1,
    borderColor: "#000000",
  },
  modalApproveButtonText: {
    fontSize: 16,
    color: "#000000ff",
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
