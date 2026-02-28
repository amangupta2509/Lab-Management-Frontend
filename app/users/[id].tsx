// Create new file: app/(admin)/users/[id].tsx

import { adminAPI } from "@/lib/api";
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

export default function UserDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadUserDetails();
  }, [id]);

  const loadUserDetails = async () => {
    try {
      const response = await adminAPI.getUserDetails(Number(id));
      setUserDetails(response.data);
    } catch (error) {
      console.error("Error loading user details:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserDetails();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Info */}
        <View style={styles.section}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {userDetails.user.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.userName}>{userDetails.user.name}</Text>
          <Text style={styles.userEmail}>{userDetails.user.email}</Text>
          {userDetails.user.department && (
            <Text style={styles.userDepartment}>
              {userDetails.user.department}
            </Text>
          )}
          {userDetails.user.role === "admin" && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#E53935" />
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>

        {/* Statistics Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={28} color="#E53935" />
              <Text style={styles.statValue}>
                {userDetails.statistics.activity.total_hours || 0}h
              </Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={28} color="#E53935" />
              <Text style={styles.statValue}>
                {userDetails.statistics.activity.total_sessions || 0}
              </Text>
              <Text style={styles.statLabel}>Lab Sessions</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="flask-outline" size={28} color="#E53935" />
              <Text style={styles.statValue}>
                {userDetails.equipmentUsage?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Equipment Used</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="book-outline" size={28} color="#E53935" />
              <Text style={styles.statValue}>
                {userDetails.statistics.bookings.total_bookings || 0}
              </Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
          </View>
        </View>

        {/* Booking Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Status</Text>
          <View style={styles.bookingStatsGrid}>
            <View style={styles.bookingStat}>
              <Text style={styles.bookingStatValue}>
                {userDetails.statistics.bookings.completed_bookings || 0}
              </Text>
              <Text style={styles.bookingStatLabel}>Completed</Text>
            </View>
            <View style={styles.bookingStat}>
              <Text style={[styles.bookingStatValue, { color: "#ff9800" }]}>
                {userDetails.statistics.bookings.pending_bookings || 0}
              </Text>
              <Text style={styles.bookingStatLabel}>Pending</Text>
            </View>
            <View style={styles.bookingStat}>
              <Text style={[styles.bookingStatValue, { color: "#f44336" }]}>
                {userDetails.statistics.bookings.rejected_bookings || 0}
              </Text>
              <Text style={styles.bookingStatLabel}>Rejected</Text>
            </View>
          </View>
        </View>

        {/* Equipment Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Usage</Text>
          {userDetails.equipmentUsage?.length ? (
            userDetails.equipmentUsage.map((equipment: any, index: number) => (
              <View key={equipment.id} style={styles.equipmentCard}>
                <View style={styles.equipmentRank}>
                  <Text style={styles.equipmentRankText}>{index + 1}</Text>
                </View>
                <View style={styles.equipmentInfo}>
                  <Text style={styles.equipmentName}>
                    {equipment.equipment_name}
                  </Text>
                  <Text style={styles.equipmentType}>
                    {equipment.equipment_type}
                  </Text>
                  <Text style={styles.equipmentStats}>
                    {equipment.total_hours}h • {equipment.usage_count} sessions
                  </Text>
                </View>
                <View style={styles.equipmentHours}>
                  <Text style={styles.equipmentHoursText}>
                    {equipment.total_hours}h
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No equipment usage yet</Text>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Lab Activity</Text>
          {userDetails.recentActivity?.length ? (
            userDetails.recentActivity.map((activity: any, index: number) => (
              <View key={index} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityDate}>
                    {format(new Date(activity.activity_date), "MMM dd, yyyy")}
                  </Text>
                  {activity.duration_minutes && (
                    <Text style={styles.activityDuration}>
                      {Math.floor(activity.duration_minutes / 60)}h{" "}
                      {activity.duration_minutes % 60}m
                    </Text>
                  )}
                </View>
                <View style={styles.activityTimes}>
                  <Text style={styles.activityTime}>
                    In: {format(new Date(activity.sign_in_time), "hh:mm a")}
                  </Text>
                  {activity.sign_out_time && (
                    <Text style={styles.activityTime}>
                      Out: {format(new Date(activity.sign_out_time), "hh:mm a")}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent activity</Text>
          )}
        </View>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
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
  errorText: {
    fontSize: 16,
    color: "#666",
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
    alignItems: "center",
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  userDepartment: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#E53935",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    alignSelf: "flex-start",
    width: "100%",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
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
    color: "#212121",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  bookingStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  bookingStat: {
    alignItems: "center",
  },
  bookingStatValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4caf50",
  },
  bookingStatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  equipmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    width: "100%",
  },
  equipmentRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  equipmentRankText: {
    color: "#fff",
    fontWeight: "bold",
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontWeight: "600",
    fontSize: 14,
    color: "#212121",
  },
  equipmentType: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  equipmentStats: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  equipmentHours: {
    alignItems: "flex-end",
  },
  equipmentHoursText: {
    fontWeight: "bold",
    color: "#E53935",
    fontSize: 16,
  },
  activityCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    width: "100%",
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  activityDate: {
    fontWeight: "600",
    color: "#212121",
  },
  activityDuration: {
    fontWeight: "bold",
    color: "#E53935",
  },
  activityTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityTime: {
    fontSize: 12,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 16,
    width: "100%",
  },
});
