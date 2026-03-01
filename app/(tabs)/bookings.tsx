

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadBookings = async () => {
    try {
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data.bookings);
      setFilteredBookings(response.data.bookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === filterStatus));
    }
  }, [filterStatus, bookings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancelBooking = (id: number) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await bookingAPI.cancel(id);
              Alert.alert("Success", "Booking cancelled successfully");
              loadBookings();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to cancel booking"
              );
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
    const canCancel = item.status === "pending";

    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.equipmentInfo}>
            <Text style={styles.equipmentName}>{item.equipment_name}</Text>
            <Text style={styles.equipmentType}>{item.equipment_type}</Text>
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

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item.id)}
          >
            <Ionicons name="close-circle-outline" size={16} color="#f44336" />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
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
      {/* Filter Tabs */}
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterStatus("all")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterStatus === "all" && styles.filterButtonTextActive,
            ]}
          >
            All ({bookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "pending" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterStatus("pending")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterStatus === "pending" && styles.filterButtonTextActive,
            ]}
          >
            Pending ({bookings.filter((b) => b.status === "pending").length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "approved" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterStatus("approved")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterStatus === "approved" && styles.filterButtonTextActive,
            ]}
          >
            Approved ({bookings.filter((b) => b.status === "approved").length})
          </Text>
        </TouchableOpacity>
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
            <Text style={styles.emptyStateSubtext}>
              Book equipment from the Equipment tab
            </Text>
          </View>
        }
      />
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

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    marginTop: 8,
    gap: 30,
    justifyContent: "center",
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  filterButtonActive: {
    backgroundColor: "#26CCC2",
    borderColor: "#26CCC2",
  },

  filterButtonText: {
    fontSize: 14,
    color: "#666",
  },

  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
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
  },
  equipmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  equipmentType: {
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
    marginVertical: 12,
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
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    gap: 4,
  },
  cancelButtonText: {
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
  },
});
