import { adminAPI } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { File, Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";

interface LogbookEntry {
  id: number;
  user_name: string;
  equipment_name?: string;
  activity_type: string;
  description: string;
  created_at: string;
}

export default function AdminLogbookScreen() {
  const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
  const [filteredLogbook, setFilteredLogbook] = useState<LogbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  // Date filter states
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadLogbook();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    applyFilters();
  }, [filterType, logbook]);

  const loadLogbook = async () => {
    try {
      const params: any = {};

      // Add date filters if set
      if (dateFrom) {
        params.date_from = format(dateFrom, "yyyy-MM-dd");
      }
      if (dateTo) {
        params.date_to = format(dateTo, "yyyy-MM-dd");
      }

      const response = await adminAPI.getLabLogbook(params);
      setLogbook(response.data.logbook);
      applyFilters();
    } catch (error) {
      console.error("Error loading logbook:", error);
      Alert.alert("Error", "Failed to load logbook");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    if (filterType === "all") {
      setFilteredLogbook(logbook);
    } else {
      setFilteredLogbook(
        logbook.filter((entry) => entry.activity_type === filterType)
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLogbook();
  };

  const clearDateFilters = () => {
    setDateFrom(null);
    setDateTo(null);
  };

  const exportToCSV = async () => {
    if (filteredLogbook.length === 0) {
      Alert.alert("No Data", "No logbook entries to export");
      return;
    }

    setIsExporting(true);
    try {
      // Create CSV with UTF-8 BOM for Excel compatibility
      const BOM = "\uFEFF";

      // Create well-formatted CSV header
      const csvHeader =
        "Date,Time,Day of Week,Activity Type,User Name,Equipment,Description\n";

      // Create CSV rows with proper formatting
      const csvRows = filteredLogbook
        .map((entry) => {
          const entryDate = new Date(entry.created_at);
          const date = format(entryDate, "yyyy-MM-dd");
          const time = format(entryDate, "HH:mm:ss");
          const dayOfWeek = format(entryDate, "EEEE"); // Full day name
          const activityType = getActivityLabel(entry.activity_type);
          const user = entry.user_name.replace(/"/g, '""'); // Escape quotes
          const equipment = (entry.equipment_name || "N/A").replace(/"/g, '""');
          const description = entry.description
            .replace(/"/g, '""')
            .replace(/\n/g, " ")
            .replace(/\r/g, "");

          return `"${date}","${time}","${dayOfWeek}","${activityType}","${user}","${equipment}","${description}"`;
        })
        .join("\n");

      const csv = BOM + csvHeader + csvRows;

      // Generate filename with date range
      const dateRangeStr =
        dateFrom && dateTo
          ? `_${format(dateFrom, "yyyy-MM-dd")}_to_${format(
              dateTo,
              "yyyy-MM-dd"
            )}`
          : dateFrom
          ? `_from_${format(dateFrom, "yyyy-MM-dd")}`
          : dateTo
          ? `_to_${format(dateTo, "yyyy-MM-dd")}`
          : `_${format(new Date(), "yyyy-MM-dd")}`;

      const filename = `Lab_Logbook${dateRangeStr}.csv`;

      // Use new FileSystem API - access the uri property
      const cacheDir = Paths.cache?.uri || Paths.cache;
      const fileUri = `${cacheDir}/${filename}`;

      // Create File instance and write content
      const file = new File(fileUri);

      // Delete file if it already exists, then create new one
      try {
        if (file.exists) {
          await file.delete();
        }
      } catch (e) {
        // File doesn't exist, which is fine
      }

      await file.create();
      await file.write(csv);

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export Lab Logbook",
          UTI: "public.comma-separated-values-text",
        });

        Alert.alert(
          "Success",
          `Successfully exported ${filteredLogbook.length} entries!\n\nFile: ${filename}`
        );
      } else {
        Alert.alert(
          "Success",
          `File saved successfully!\n\nLocation: ${fileUri}\n\nNote: Sharing is not available on this device.`
        );
      }
    } catch (error: any) {
      console.error("Export error:", error);
      Alert.alert(
        "Export Failed",
        `Could not export logbook to CSV.\n\nError: ${
          error?.message || "Unknown error"
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "sign_in":
        return { name: "log-in", color: "#4caf50" };
      case "sign_out":
        return { name: "log-out", color: "#666" };
      case "booking_created":
        return { name: "calendar", color: "#2196F3" };
      case "booking_approved":
        return { name: "checkmark-circle", color: "#4caf50" };
      case "booking_rejected":
        return { name: "close-circle", color: "#E53935" };
      case "usage_started":
        return { name: "play-circle", color: "#ff9800" };
      case "usage_ended":
        return { name: "stop-circle", color: "#666" };
      default:
        return { name: "information-circle", color: "#2196F3" };
    }
  };

  const getActivityLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderLogEntry = ({ item }: { item: LogbookEntry }) => {
    const icon = getActivityIcon(item.activity_type);

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${icon.color}20` },
            ]}
          >
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>
          <View style={styles.logInfo}>
            <Text style={styles.logType}>
              {getActivityLabel(item.activity_type)}
            </Text>
            <Text style={styles.logTime}>
              {format(new Date(item.created_at), "MMM dd, yyyy • hh:mm a")}
            </Text>
          </View>
        </View>

        <Text style={styles.logDescription}>{item.description}</Text>

        <View style={styles.logFooter}>
          <View style={styles.logDetail}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.logDetailText}>{item.user_name}</Text>
          </View>
          {item.equipment_name && (
            <View style={styles.logDetail}>
              <Ionicons name="flask-outline" size={14} color="#666" />
              <Text style={styles.logDetailText}>{item.equipment_name}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Filter Section */}
      <View style={styles.dateFilterContainer}>
        <Text style={styles.dateFilterTitle}>Filter by Date Range</Text>

        <View style={styles.datePickersRow}>
          {/* From Date */}
          <View style={styles.datePickerGroup}>
            <Text style={styles.dateLabel}>From</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDateFromPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.dateButtonText}>
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "Select Date"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* To Date */}
          <View style={styles.datePickerGroup}>
            <Text style={styles.dateLabel}>To</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDateToPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.dateButtonText}>
                {dateTo ? format(dateTo, "MMM dd, yyyy") : "Select Date"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          {(dateFrom || dateTo) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearDateFilters}
            >
              <Ionicons name="close-circle" size={16} color="#666" />
              <Text style={styles.clearButtonText}>Clear Dates</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.exportButton,
              isExporting && styles.exportButtonDisabled,
            ]}
            onPress={exportToCSV}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.exportButtonText}>Export CSV</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Pickers */}
      {showDateFromPicker && (
        <DateTimePicker
          value={dateFrom || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowDateFromPicker(Platform.OS === "ios");
            if (selectedDate) {
              setDateFrom(selectedDate);
            }
          }}
          maximumDate={dateTo || new Date()}
        />
      )}

      {showDateToPicker && (
        <DateTimePicker
          value={dateTo || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowDateToPicker(Platform.OS === "ios");
            if (selectedDate) {
              setDateTo(selectedDate);
            }
          }}
          minimumDate={dateFrom || undefined}
          maximumDate={new Date()}
        />
      )}

      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {[
            { key: "all", label: "All" },
            { key: "sign_in", label: "Sign In" },
            { key: "sign_out", label: "Sign Out" },
            { key: "booking_created", label: "Bookings" },
            { key: "booking_approved", label: "Approved" },
            { key: "booking_rejected", label: "Rejected" },
            { key: "usage_started", label: "Started" },
            { key: "usage_ended", label: "Ended" },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                filterType === filter.key && styles.filterTabActive,
              ]}
              onPress={() => setFilterType(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterType === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{filteredLogbook.length}</Text>
          <Text style={styles.statLabel}>
            {filterType === "all" ? "Total Events" : "Filtered"}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#4caf50" }]}>
            {logbook.filter((e) => e.activity_type === "sign_in").length}
          </Text>
          <Text style={styles.statLabel}>Sign Ins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#2196F3" }]}>
            {
              logbook.filter((e) => e.activity_type === "booking_created")
                .length
            }
          </Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
      </View>

      {/* Logbook List */}
      <FlatList
        data={filteredLogbook}
        renderItem={renderLogEntry}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No logbook entries found</Text>
            {(dateFrom || dateTo) && (
              <Text style={styles.emptyStateSubtext}>
                Try adjusting the date filter
              </Text>
            )}
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

  // Date Filter Styles
  dateFilterContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  dateFilterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  datePickersRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  datePickerGroup: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "600",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 8,
  },
  dateButtonText: {
    fontSize: 13,
    color: "#212121",
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    gap: 6,
  },
  clearButtonText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonDisabled: {
    backgroundColor: "#90caf9",
  },
  exportButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  filterWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  filterTabActive: {
    backgroundColor: "#E53935",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  logCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#E53935",
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  logTime: {
    fontSize: 12,
    color: "#999",
  },
  logDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  logFooter: {
    flexDirection: "row",
    gap: 16,
  },
  logDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logDetailText: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
    marginTop: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#bbb",
    marginTop: 8,
  },
});
