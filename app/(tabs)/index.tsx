import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { userAPI } from "@/lib/api";

interface DashboardData {
  todayActivity: any;
  upcomingBookings: any[];
  recentNotifications: any[];
  unreadNotificationCount: number;
  weekStats: {
    workHours: string;
    sessions: number;
  };
  activeSession: any;
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const response = await userAPI.getDashboard();
      console.log("📊 Dashboard raw data:", response.data.dashboard);

      const dashboard = response.data.dashboard;

      // ✅ FIXED: Ensure weekStats has proper defaults and safe parsing
      const weekStats = {
        workHours: dashboard.weekStats?.workHours
          ? String(dashboard.weekStats.workHours)
          : "0.00",
        sessions: dashboard.weekStats?.sessions
          ? Number(dashboard.weekStats.sessions)
          : 0,
      };

      console.log("✅ Processed weekStats:", weekStats);

      setDashboardData({
        ...dashboard,
        weekStats,
        upcomingBookings: dashboard.upcomingBookings || [],
        recentNotifications: dashboard.recentNotifications || [],
        unreadNotificationCount: dashboard.unreadNotificationCount || 0,
        todayActivity: dashboard.todayActivity || null,
        activeSession: dashboard.activeSession || null,
      });
    } catch (error) {
      console.error("❌ Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#26CCC2" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/(tabs)/activity")}
        >
          <Ionicons name="notifications-outline" size={24} color="#212121" />
          {dashboardData && dashboardData.unreadNotificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {dashboardData.unreadNotificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Session Alert */}
      {dashboardData?.activeSession && (
        <TouchableOpacity
          style={styles.activeSessionCard}
          onPress={() => router.push("/(tabs)/sessions")}
        >
          <View style={styles.activeSessionHeader}>
            <Ionicons name="time" size={24} color="#26CCC2" />
            <Text style={styles.activeSessionTitle}>Active Session</Text>
          </View>
          <Text style={styles.activeSessionText}>
            {dashboardData.activeSession.equipment_name}
          </Text>
          <Text style={styles.activeSessionSubtext}>
            Started:{" "}
            {new Date(
              dashboardData.activeSession.start_time
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push("/(tabs)/activity")}
        >
          <Ionicons name="time-outline" size={32} color="#26CCC2" />
          <Text style={styles.statValue}>
            {dashboardData?.weekStats?.workHours || "0.00"}h
          </Text>
          <Text style={styles.statLabel}>This Week</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push("/(tabs)/bookings")}
        >
          <Ionicons name="calendar-outline" size={32} color="#26CCC2" />
          <Text style={styles.statValue}>
            {dashboardData?.upcomingBookings?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push("/(tabs)/sessions")}
        >
          <Ionicons name="bar-chart-outline" size={32} color="#26CCC2" />
          <Text style={styles.statValue}>
            {dashboardData?.weekStats?.sessions || 0}
          </Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push("/(tabs)/equipment")}
          >
            <Ionicons name="add-circle-outline" size={24} color="#26CCC2" />
            <Text style={styles.quickActionText}>New Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push("/(tabs)/bookings")}
          >
            <Ionicons name="list-outline" size={24} color="#26CCC2" />
            <Text style={styles.quickActionText}>My Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/bookings")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {dashboardData?.upcomingBookings &&
        dashboardData.upcomingBookings.length > 0 ? (
          dashboardData.upcomingBookings.slice(0, 3).map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => router.push("/(tabs)/bookings")}
            >
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingEquipment}>
                  {booking.equipment_name}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        booking.status === "approved" ? "#e8f5e9" : "#fff3e0",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          booking.status === "approved" ? "#4caf50" : "#ff9800",
                      },
                    ]}
                  >
                    {booking.status}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingDetails}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.bookingDate}>
                  {new Date(booking.booking_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.bookingDetails}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.bookingTime}>
                  {booking.start_time} - {booking.end_time}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No upcoming bookings</Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => router.push("/(tabs)/equipment")}
            >
              <Text style={styles.emptyActionText}>Book Equipment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/activity")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {dashboardData?.recentNotifications &&
        dashboardData.recentNotifications.length > 0 ? (
          dashboardData.recentNotifications.slice(0, 3).map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={styles.notificationCard}
              onPress={() => router.push("/(tabs)/activity")}
            >
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {new Date(notification.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {!notification.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No notifications</Text>
          </View>
        )}
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  notificationButton: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#26CCC2",
    borderRadius: 10,
    width: 17,
    height: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  activeSessionCard: {
    backgroundColor: "#e8f5e9",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#26CCC2",
  },
  activeSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  activeSessionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginLeft: 8,
  },
  activeSessionText: {
    fontSize: 14,
    color: "#212121",
    marginTop: 4,
  },
  activeSessionSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  viewAllText: {
    fontSize: 14,
    color: "#26CCC2",
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  quickActionText: {
    fontSize: 14,
    color: "#212121",
    marginTop: 8,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bookingEquipment: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  bookingDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  bookingDate: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  bookingTime: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#26CCC2",
    marginLeft: 12,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
  },
  emptyActionButton: {
    marginTop: 16,
    backgroundColor: "#26CCC2",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
