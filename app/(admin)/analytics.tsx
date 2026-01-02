import { adminAPI } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function AdminAnalyticsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [utilization, setUtilization] = useState<any>(null);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [dailyPatterns, setDailyPatterns] = useState<any[]>([]);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [selectedDays]);

  const loadAnalytics = async () => {
    try {
      const [utilizationRes, peakHoursRes, patternsRes] = await Promise.all([
        adminAPI.getMachineUtilizationAnalytics({ days: selectedDays }),
        adminAPI.getPeakHoursAnalysis(),
        adminAPI.getDailyUsagePatterns({ days: selectedDays }),
      ]);

      setUtilization(utilizationRes.data);
      setPeakHours(peakHoursRes.data.peak_hours);
      setDailyPatterns(patternsRes.data.patterns);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const busiestHour =
    peakHours.length > 0
      ? peakHours.reduce((max, hour) =>
          hour.session_count > max.session_count ? hour : max
        )
      : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Time Range Selector */}
      <View style={styles.rangeSelector}>
        {[7, 30, 90].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              styles.rangeButton,
              selectedDays === days && styles.rangeButtonActive,
            ]}
            onPress={() => setSelectedDays(days)}
          >
            <Text
              style={[
                styles.rangeButtonText,
                selectedDays === days && styles.rangeButtonTextActive,
              ]}
            >
              {days} Days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Utilization Summary */}
      {utilization?.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Machine Utilization</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="construct" size={32} color="#2196F3" />
              <Text style={styles.statValue}>
                {utilization.summary.total_machines ?? 0}
              </Text>
              <Text style={styles.statLabel}>Total Machines</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={32} color="#4caf50" />
              <Text style={styles.statValue}>
                {utilization.summary.average_utilization_hours ?? 0}h
              </Text>
              <Text style={styles.statLabel}>Avg Hours</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="warning" size={32} color="#ff9800" />
              <Text style={styles.statValue}>
                {utilization.summary.underused_count ?? 0}
              </Text>
              <Text style={styles.statLabel}>Underused</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="flash" size={32} color="#f44336" />
              <Text style={styles.statValue}>
                {utilization.summary.overloaded_count ?? 0}
              </Text>
              <Text style={styles.statLabel}>Overloaded</Text>
            </View>
          </View>

          {/* Top Machines */}
          <View style={styles.topMachines}>
            <Text style={styles.subsectionTitle}>Most Used Equipment</Text>
            {utilization.machines
              ?.slice(0, 5)
              .map((machine: any, index: number) => (
                <View key={machine.id} style={styles.machineRow}>
                  <View style={styles.machineRank}>
                    <Text style={styles.machineRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.machineInfo}>
                    <Text style={styles.machineName}>{machine.name}</Text>
                    <Text style={styles.machineStats}>
                      {machine.total_hours}h • {machine.total_sessions} sessions
                    </Text>
                  </View>
                  <View style={styles.machineProgress}>
                    <View
                      style={[
                        styles.machineProgressBar,
                        {
                          width: `${Math.min(
                            (machine.total_hours /
                              Math.max(
                                utilization.summary.average_utilization_hours ??
                                  1,
                                1
                              )) *
                              50,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Peak Hours */}
      {peakHours.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peak Usage Hours</Text>

          <View style={styles.peakHourCard}>
            <Ionicons name="time" size={48} color="#ff9800" />
            {busiestHour && (
              <>
                <Text style={styles.peakHourValue}>
                  {busiestHour.hour_of_day}:00 - {busiestHour.hour_of_day + 1}
                  :00
                </Text>
                <Text style={styles.peakHourLabel}>Busiest Hour</Text>
                <Text style={styles.peakHourStats}>
                  {busiestHour.session_count} sessions •{" "}
                  {busiestHour.users_active} users
                </Text>
              </>
            )}

            <Text style={styles.peakHourLabel}>Busiest Hour</Text>
            <Text style={styles.peakHourStats}>
              {busiestHour.session_count} sessions • {busiestHour.users_active}{" "}
              users
            </Text>
          </View>

          <View style={styles.hourlyChart}>
            {peakHours.map((hour) => (
              <View key={hour.hour_of_day} style={styles.hourBar}>
                <View
                  style={[
                    styles.hourBarFill,
                    {
                      height: `${
                        busiestHour
                          ? (hour.session_count / busiestHour.session_count) *
                            100
                          : 0
                      }%`,
                    },
                  ]}
                />
                <Text style={styles.hourLabel}>{hour.hour_of_day}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Daily Patterns */}
      {dailyPatterns.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Usage Patterns</Text>

          {dailyPatterns.slice(0, 7).map((day: any) => (
            <View key={day.usage_date} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayDate}>
                  {new Date(day.usage_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={styles.dayValue}>
                  {Math.round(day.total_minutes / 60)}h
                </Text>
              </View>
              <View style={styles.dayStats}>
                <View style={styles.dayStat}>
                  <Ionicons name="people-outline" size={16} color="#666" />
                  <Text style={styles.dayStatText}>
                    {day.unique_users} users
                  </Text>
                </View>
                <View style={styles.dayStat}>
                  <Ionicons name="flash-outline" size={16} color="#666" />
                  <Text style={styles.dayStatText}>
                    {day.session_count} sessions
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  rangeSelector: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  rangeButtonActive: {
    backgroundColor: "#2196F3",
  },
  rangeButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  rangeButtonTextActive: {
    color: "#fff",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  topMachines: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  machineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  machineRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
  },
  machineRankText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  machineInfo: {
    flex: 1,
  },
  machineName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  machineStats: {
    fontSize: 12,
    color: "#666",
  },
  machineProgress: {
    width: 80,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  machineProgressBar: {
    height: "100%",
    backgroundColor: "#2196F3",
  },
  peakHourCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  peakHourValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 16,
  },
  peakHourLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  peakHourStats: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  hourlyChart: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    height: 150,
    alignItems: "flex-end",
    gap: 4,
  },
  hourBar: {
    flex: 1,
    alignItems: "center",
  },
  hourBarFill: {
    width: "100%",
    backgroundColor: "#2196F3",
    borderRadius: 4,
    minHeight: 4,
  },
  hourLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  dayValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
  },
  dayStats: {
    flexDirection: "row",
    gap: 16,
  },
  dayStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dayStatText: {
    fontSize: 12,
    color: "#666",
  },
});
