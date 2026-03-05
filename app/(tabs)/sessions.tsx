import { bookingAPI, usageAPI } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO, isToday, parse } from "date-fns";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface UsageSession {
  id: number;
  booking_id: number;
  equipment_name: string;
  equipment_type: string;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string;
}

interface AvailableBooking {
  id: number;
  equipment_name: string;
  equipment_type: string;
  booking_date: string;
  start_time: string;
  end_time: string;
}

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<UsageSession[]>([]);
  const [availableBookings, setAvailableBookings] = useState<
    AvailableBooking[]
  >([]);
  const [activeSession, setActiveSession] = useState<UsageSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endNotes, setEndNotes] = useState("");

  useEffect(() => {
    loadData();
    // Refresh every minute to update available sessions
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Load usage sessions
      const sessionsResponse = await usageAPI.getMySessions();
      setSessions(sessionsResponse.data.sessions);

      // Find active session
      const active = sessionsResponse.data.sessions.find(
        (s: UsageSession) => !s.end_time
      );
      setActiveSession(active || null);

      // Load approved bookings
      const bookingsResponse = await bookingAPI.getMyBookings({
        status: "approved",
      });

      // Filter bookings to show only those scheduled for TODAY and whose start time has arrived
      const available = bookingsResponse.data.bookings.filter((b: any) => {
        // Check if this booking already has a session
        const hasSession = sessionsResponse.data.sessions.some(
          (s: UsageSession) => s.booking_id === b.id && !s.end_time
        );

        if (hasSession) return false;

        // Parse booking date
        const bookingDate = parseISO(b.booking_date);

        // Check if booking is for today
        if (!isToday(bookingDate)) {
          return false;
        }

        // Get current time
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        // Parse booking start time (format: "HH:mm")
        const [startHours, startMinutes] = b.start_time.split(":").map(Number);
        const bookingStartTimeInMinutes = startHours * 60 + startMinutes;

        // Parse booking end time
        const [endHours, endMinutes] = b.end_time.split(":").map(Number);
        const bookingEndTimeInMinutes = endHours * 60 + endMinutes;

        // Show booking only if:
        // 1. It's approved
        // 2. It's today
        // 3. Current time is within or after the booking start time
        // 4. Current time is before the booking end time
        return (
          b.status === "approved" &&
          currentTimeInMinutes >= bookingStartTimeInMinutes &&
          currentTimeInMinutes < bookingEndTimeInMinutes
        );
      });

      setAvailableBookings(available);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load sessions");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStartSession = async (bookingId: number) => {
    try {
      await usageAPI.startSession(bookingId);
      Alert.alert("Success", "Session started successfully");
      setShowStartModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to start session"
      );
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await usageAPI.endSession(activeSession.id, endNotes);
      Alert.alert("Success", "Session ended successfully");
      setShowEndModal(false);
      setEndNotes("");
      loadData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to end session"
      );
    }
  };

  const renderSessionCard = ({ item }: { item: UsageSession }) => {
    const isActive = !item.end_time;

    return (
      <View style={[styles.sessionCard, isActive && styles.activeSessionCard]}>
        {isActive && (
          <View style={styles.activeBadge}>
            <Ionicons name="radio-button-on" size={12} color="#4caf50" />
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}

        <View style={styles.sessionHeader}>
          <Ionicons name="flask" size={24} color="#26CCC2" />
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionEquipment}>{item.equipment_name}</Text>
            <Text style={styles.sessionType}>{item.equipment_type}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {format(new Date(item.booking_date), "MMM dd, yyyy")}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              Started: {format(new Date(item.start_time), "hh:mm a")}
            </Text>
          </View>

          {item.end_time && (
            <>
              <View style={styles.detailRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.detailText}>
                  Ended: {format(new Date(item.end_time), "hh:mm a")}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="timer-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  Duration: {Math.floor(item.duration_minutes! / 60)}h{" "}
                  {item.duration_minutes! % 60}m
                </Text>
              </View>
            </>
          )}

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>

        {isActive && (
          <TouchableOpacity
            style={styles.endButton}
            onPress={() => {
              setActiveSession(item);
              setShowEndModal(true);
            }}
          >
            <Ionicons name="stop-circle-outline" size={20} color="#f44336" />
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
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
      {/* Header with Start Button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Usage Sessions</Text>
          <Text style={styles.headerSubtitle}>
            {activeSession
              ? "Session in progress"
              : `${sessions.length} total sessions`}
          </Text>
        </View>
        {availableBookings.length > 0 && !activeSession && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowStartModal(true)}
          >
            <Ionicons name="play-circle" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Session Alert */}
      {activeSession && (
        <View style={styles.activeAlert}>
          <Ionicons name="time" size={24} color="#26CCC2" />
          <Text style={styles.activeAlertText}>
            You have an active session running
          </Text>
        </View>
      )}

      {/* Info Message when no bookings available */}
      {!activeSession &&
        availableBookings.length === 0 &&
        sessions.length === 0 && (
          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={32}
              color="#2196F3"
            />
            <Text style={styles.infoTitle}>Sessions start automatically</Text>
            <Text style={styles.infoText}>
              Approved bookings will appear here when their scheduled start time
              arrives
            </Text>
          </View>
        )}

      {/* Sessions List */}
      <FlatList
        data={sessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flask-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No sessions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Sessions will appear when you start using approved bookings
              </Text>
            </View>
          ) : null
        }
      />

      {/* Start Session Modal */}
      <Modal visible={showStartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Usage Session</Text>
              <TouchableOpacity onPress={() => setShowStartModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Select a booking to start your session:
              </Text>

              {availableBookings.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingOption}
                  onPress={() => handleStartSession(booking.id)}
                >
                  <View style={styles.bookingOptionIcon}>
                    <Ionicons name="flask" size={24} color="#26CCC2" />
                  </View>
                  <View style={styles.bookingOptionInfo}>
                    <Text style={styles.bookingOptionName}>
                      {booking.equipment_name}
                    </Text>
                    <Text style={styles.bookingOptionDetails}>
                      {booking.start_time} - {booking.end_time}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
              ))}

              {availableBookings.length === 0 && (
                <View style={styles.emptyBookings}>
                  <Ionicons name="time-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyBookingsText}>
                    No bookings ready to start
                  </Text>
                  <Text style={styles.emptyBookingsSubtext}>
                    Bookings appear here when their start time arrives
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* End Session Modal */}
      <Modal visible={showEndModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>End Session</Text>
              <TouchableOpacity onPress={() => setShowEndModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {activeSession && (
                <>
                  <View style={styles.endSessionInfo}>
                    <Text style={styles.endSessionLabel}>Equipment:</Text>
                    <Text style={styles.endSessionValue}>
                      {activeSession.equipment_name}
                    </Text>
                  </View>

                  <View style={styles.endSessionInfo}>
                    <Text style={styles.endSessionLabel}>Started:</Text>
                    <Text style={styles.endSessionValue}>
                      {format(new Date(activeSession.start_time), "hh:mm a")}
                    </Text>
                  </View>

                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={endNotes}
                    onChangeText={setEndNotes}
                    placeholder="Add any notes about the session..."
                    placeholderTextColor="#000000ff"
                    multiline
                    numberOfLines={4}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEndModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleEndSession}
              >
                <Text style={styles.confirmButtonText}>End Session</Text>
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
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#26CCC2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    gap: 6,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  activeAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  activeAlertText: {
    flex: 1,
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#e3f2fd",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976d2",
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1976d2",
    textAlign: "center",
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activeSessionCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#26CCC2",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4caf50",
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionEquipment: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  sessionType: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  sessionDetails: {
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
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#212121",
  },
  endButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    gap: 6,
  },
  endButtonText: {
    fontSize: 14,
    color: "#f44336",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
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
    maxHeight: "80%",
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
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  bookingOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 12,
  },
  bookingOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bookingOptionInfo: {
    flex: 1,
  },
  bookingOptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  bookingOptionDetails: {
    fontSize: 14,
    color: "#666",
  },
  emptyBookings: {
    alignItems: "center",
    padding: 32,
  },
  emptyBookingsText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyBookingsSubtext: {
    fontSize: 13,
    color: "#bbb",
    marginTop: 8,
    textAlign: "center",
  },
  endSessionInfo: {
    marginBottom: 16,
  },
  endSessionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  endSessionValue: {
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
  confirmButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#f44336",
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
