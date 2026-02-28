import { adminAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ================= TYPES ================= */

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalEquipment: number;
  availableEquipment: number;
  pendingBookings: number;
  todayBookings: number;
  totalPrints?: number;
  topPrinter?: {
    name: string;
    total_prints: number;
  };
}

interface EquipmentUsage {
  id: number;
  name: string;
  utilization_percent: number;
}

/* ================= SCREEN ================= */

export default function AdminDashboardScreen() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usage, setUsage] = useState<EquipmentUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const [statsRes, usageRes, productivityRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getMachineUtilizationAnalytics({ days: 30 }),
        adminAPI.getUserProductivity(),
      ]);

      setStats(statsRes.data.stats);
      setUsage(usageRes.data.machines || []);

      // Calculate total prints
      const totalPrints = productivityRes.data.productivity.reduce(
        (sum: number, user: any) => sum + (user.total_prints || 0),
        0
      );

      setStats((prev: any) => ({
        ...prev,
        totalPrints,
        topPrinter: productivityRes.data.productivity[0] || null,
      }));
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color="#E53935" />
      </View>

      {/* ================= STATS ================= */}
      <View style={styles.grid}>
        <StatCard
          icon="people-outline"
          label="Active Users"
          value={stats?.activeUsers ?? 0}
        />
        <StatCard
          icon="calendar-outline"
          label="Pending"
          value={stats?.pendingBookings ?? 0}
          urgent
        />
        <StatCard
          icon="flask-outline"
          label="Equipment"
          value={stats?.totalEquipment ?? 0}
        />
        <StatCard
          icon="book-outline"
          label="Bookings Today"
          value={stats?.todayBookings ?? 0}
        />
      </View>

      {/* ================= PRINT STATISTICS ================= */}
      {/* {stats?.totalPrints !== undefined && (
        <>
          <Text style={styles.section}>Print Statistics</Text>
          <View style={styles.printStatsContainer}>
            <View style={styles.printCard}>
              <Ionicons name="print" size={32} color="#E53935" />
              <Text style={styles.printValue}>{stats.totalPrints}</Text>
              <Text style={styles.printLabel}>Total Prints</Text>
            </View>
            {stats.topPrinter && (
              <View style={styles.printCard}>
                <Ionicons name="trophy" size={32} color="#ff9800" />
                <Text style={styles.printValue}>
                  {stats.topPrinter.total_prints}
                </Text>
                <Text style={styles.printLabel}>Top Printer</Text>
                <Text style={styles.topPrinterName}>
                  {stats.topPrinter.name}
                </Text>
              </View>
            )}
          </View>
        </>
      )} */}

      {/* ================= QUICK ACTIONS ================= */}
      <Text style={styles.section}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <Action
          icon="checkmark-circle"
          label="Approve"
          onPress={() =>
            router.push({
              pathname: "/(admin)/bookings",
              params: { status: "pending" },
            })
          }
        />

        <Action
          icon="add-circle"
          label="Add Equipment"
          onPress={() => router.push("/(admin)/equipment")}
        />

        <Action icon="document-text" label="Reports" />
        <Action
          icon="cube"
          label="Inventory"
          onPress={() => router.push("/(admin)/inventory/" as any)}
        />
      </View>

      {/* ================= EQUIPMENT USAGE ================= */}
      <Text style={styles.section}>Equipment Usage</Text>

      {usage.length === 0 ? (
        <Text style={styles.emptyText}>No usage data available</Text>
      ) : (
        usage.map((item) => (
          <Usage
            key={item.id}
            label={item.name}
            value={item.utilization_percent}
          />
        ))
      )}
    </ScrollView>
  );
}

/* ================= COMPONENTS ================= */

const StatCard = ({ icon, label, value, urgent }: any) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <Ionicons name={icon} size={20} color="#E53935" />
      {urgent && <Text style={styles.urgent}>Urgent</Text>}
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

const Action = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.7}>
    <Ionicons name={icon} size={28} color="#E53935" />
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

const Usage = ({ label, value }: any) => (
  <View style={styles.usageContainer}>
    <View style={styles.usageRow}>
      <Text style={styles.usageLabel}>{label}</Text>
      <Text style={styles.usageValue}>{value}%</Text>
    </View>
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${value}%` }]} />
    </View>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  welcome: { color: "#6B7280" },
  name: { color: "#111827", fontSize: 22, fontWeight: "700" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  urgent: {
    backgroundColor: "#FEE2E2",
    color: "#E53935",
    textAlign: "center",
    textAlignVertical: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "600",
  },

  cardValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  cardLabel: { color: "#6B7280" },

  section: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 12,
  },

  /* QUICK ACTIONS 2x2 */
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  action: {
    width: "48%",
    backgroundColor: "#ffffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
  },
  actionText: {
    marginTop: 10,
    color: "#374151",
    fontWeight: "600",
  },

  /* USAGE */
  usageContainer: { marginBottom: 16 },
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  usageLabel: { color: "#374151" },
  usageValue: { color: "#E53935", fontWeight: "600" },
  barBg: {
    height: 8,
    backgroundColor: "#ffffffff",
    borderRadius: 6,
    marginTop: 6,
  },
  barFill: {
    height: 8,
    backgroundColor: "#E53935",
    borderRadius: 6,
  },

  emptyText: {
    color: "#9CA3AF",
    fontStyle: "italic",
    marginBottom: 4,
  },
  printStatsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
  },
  printCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    elevation: 3,
  },
  printValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  printLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  topPrinterName: {
    fontSize: 11,
    color: "#E53935",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
});
