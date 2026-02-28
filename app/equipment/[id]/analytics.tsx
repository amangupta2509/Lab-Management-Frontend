import { equipmentAPI } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EquipmentAnalyticsScreen() {
  const { id } = useLocalSearchParams();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadAnalytics();
  }, [id, selectedDays]);

  const loadAnalytics = async () => {
    try {
      const response = await equipmentAPI.getAnalytics(Number(id), {
        days: selectedDays,
      });
      setAnalytics(response.data);
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
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ================= FIXED HEADER ================= */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment Analytics</Text>
      </View>

      {/* ================= SCROLLABLE CONTENT ================= */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Equipment Info */}
        <View style={styles.section}>
          <Text style={styles.equipmentName}>{analytics?.equipment?.name}</Text>
          <Text style={styles.equipmentType}>{analytics?.equipment?.type}</Text>
        </View>

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

        {/* Usage Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={28} color="#E53935" />
              <Text style={styles.statValue}>
                {analytics?.usage?.total_hours || 0}h
              </Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="flash-outline" size={28} color="#E53935" />
              <Text style={styles.statValue}>
                {analytics?.usage?.total_sessions || 0}
              </Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={28} color="#E53935" />
              <Text style={styles.statValue}>
                {analytics?.usage?.unique_users || 0}
              </Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={28} color="#E53935" />
              <Text style={styles.statValue}>
                {analytics?.bookings?.total_bookings || 0}
              </Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
          </View>
        </View>

        {/* Top Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Users</Text>
          {analytics?.userUsage?.length ? (
            analytics.userUsage.slice(0, 5).map((user: any, index: number) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userRank}>
                  <Text style={styles.userRankText}>{index + 1}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <View>
                  <Text style={styles.userHours}>{user.total_hours}h</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No usage data available</Text>
          )}
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {analytics?.recentSessions?.length ? (
            analytics.recentSessions.map((session: any) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionUser}>{session.user_name}</Text>
                  <Text style={styles.sessionDate}>
                    {format(new Date(session.start_time), "MMM dd, yyyy")}
                  </Text>
                </View>
                <Text style={styles.sessionTime}>
                  {format(new Date(session.start_time), "hh:mm a")}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent sessions</Text>
          )}
        </View>
        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

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
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 16,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },

  section: {
    padding: 16,
  },

  equipmentName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },

  equipmentType: {
    fontSize: 16,
    color: "#666",
  },

  rangeSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },

  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
  },

  rangeButtonActive: {
    backgroundColor: "#E53935",
  },

  rangeButtonText: {
    color: "#333",
    fontWeight: "600",
  },

  rangeButtonTextActive: {
    color: "#fff",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },

  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 6,
  },

  statLabel: {
    fontSize: 12,
    color: "#666",
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },

  userRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  userRankText: {
    color: "#fff",
    fontWeight: "bold",
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontWeight: "600",
  },

  userEmail: {
    fontSize: 12,
    color: "#666",
  },

  userHours: {
    fontWeight: "bold",
    color: "#E53935",
  },

  sessionCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },

  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  sessionUser: {
    fontWeight: "600",
  },

  sessionDate: {
    fontSize: 12,
    color: "#666",
  },

  sessionTime: {
    marginTop: 4,
    color: "#666",
  },

  emptyText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 16,
  },
});
