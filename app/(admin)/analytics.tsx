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

      {utilization?.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Machine Utilization</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="construct" size={32} color="#E53935" />
              <Text style={styles.statValue}>
                {utilization.summary.total_machines ?? 0}
              </Text>
              <Text style={styles.statLabel}>Total Machines</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={32} color="#E53935" />
              <Text style={styles.statValue}>
                {utilization.summary.average_utilization_hours ?? 0}h
              </Text>
              <Text style={styles.statLabel}>Avg Hours</Text>
            </View>

            <View style={[styles.statCard]}>
              <Ionicons name="alert-circle" size={32} color="#ff9800" />
              <Text style={[styles.statValue, { color: "#ff9800" }]}>
                {utilization.summary.underused_count ?? 0}
              </Text>
              <Text style={styles.statLabel}>Underused</Text>
              <Text style={styles.alertSubtext}>{"<20% usage"}</Text>
            </View>

            <View style={[styles.statCard]}>
              <Ionicons name="warning" size={32} color="#E53935" />
              <Text style={[styles.statValue, { color: "#E53935" }]}>
                {utilization.summary.overloaded_count ?? 0}
              </Text>
              <Text style={styles.statLabel}>Overloaded</Text>
              <Text style={styles.alertSubtext}>{">80% usage"}</Text>
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
            <Ionicons name="time" size={48} color="#E53935" />
            {busiestHour && (
              <>
                <Text style={styles.peakHourValue}>
                  {busiestHour.hour_of_day === 0
                    ? "12"
                    : busiestHour.hour_of_day > 12
                    ? busiestHour.hour_of_day - 12
                    : busiestHour.hour_of_day}
                  :00 {busiestHour.hour_of_day >= 12 ? "PM" : "AM"} -{" "}
                  {busiestHour.hour_of_day + 1 === 0
                    ? "12"
                    : busiestHour.hour_of_day + 1 > 12
                    ? busiestHour.hour_of_day + 1 - 12
                    : busiestHour.hour_of_day + 1}
                  :00 {busiestHour.hour_of_day + 1 >= 12 ? "PM" : "AM"}
                </Text>
                <Text style={styles.peakHourLabel}>Busiest Hour</Text>
                <Text style={styles.peakHourStats}>
                  {busiestHour.session_count} sessions •{" "}
                  {busiestHour.users_active} users
                </Text>
              </>
            )}
          </View>

          <View style={styles.chartContainer}>
            {/* Chart area with Y-axis inside */}
            <View style={styles.chartArea}>
              <View style={styles.chartWithAxis}>
                {/* Bars */}
                <View style={styles.hourlyChart}>
                  {peakHours.map((hour) => (
                    <View key={hour.hour_of_day} style={styles.hourBar}>
                      <View
                        style={[
                          styles.hourBarFill,
                          {
                            height: `${
                              busiestHour
                                ? (hour.session_count /
                                    busiestHour.session_count) *
                                  100
                                : 0
                            }%`,
                          },
                        ]}
                      />
                      <Text style={styles.hourLabel}>
                        {hour.hour_of_day === 0
                          ? "12AM"
                          : hour.hour_of_day < 12
                          ? `${hour.hour_of_day}AM`
                          : hour.hour_of_day === 12
                          ? "12PM"
                          : `${hour.hour_of_day - 12}PM`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.xAxisTitle}>Hour of Day</Text>
            </View>
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
    backgroundColor: "#E53935",
  },

  chartContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    paddingTop: 33,
    paddingBottom: 13,
    gap: 2,
  },

  chartArea: {
    flex: 1,
  },
  chartWithAxis: {
    flexDirection: "row",
    height: 150,
  },

  alertSubtext: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },

  hourlyChart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    paddingLeft: 2,
    paddingBottom: 8,
    paddingRight: 4,
  },
  hourBar: {
    flex: 1,
    alignItems: "center",
  },
  hourBarFill: {
    width: "100%",
    backgroundColor: "#E53935",
    borderRadius: 4,
    minHeight: 4,
  },
  hourLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    fontWeight: "500",
  },
  xAxisTitle: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
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
    backgroundColor: "#E53935",
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
    backgroundColor: "#E53935",
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
    color: "#E53935",
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
