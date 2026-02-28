import { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  View,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";

interface InventoryAlert {
  id: number;
  item_name: string;
  alert_message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  is_resolved: boolean;
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async () => {
    try {
      const res = await api.get("/inventory/alerts");
      console.log("📦 Alerts Response:", res.data);
      setAlerts(res.data.alerts || []);
    } catch (error: any) {
      console.error("❌ Alerts Error:", error);
      Alert.alert("Error", "Failed to load alerts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleResolve = (alert: InventoryAlert) => {
    Alert.alert(
      "Resolve Alert",
      `Mark "${alert.item_name}" alert as resolved?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          onPress: async () => {
            try {
              await api.put(`/inventory/alerts/${alert.id}/resolve`);
              Alert.alert("Success", "Alert resolved");
              loadAlerts();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to resolve alert"
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={alerts}
      keyExtractor={(a) => a.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => {
        const severityColors = {
          LOW: { bg: "#FFF9C4", text: "#F57F17", icon: "information-circle" },
          MEDIUM: { bg: "#FFE0B2", text: "#E65100", icon: "warning" },
          HIGH: { bg: "#FFCDD2", text: "#C62828", icon: "alert-circle" },
          CRITICAL: { bg: "#D32F2F", text: "#FFFFFF", icon: "alert" },
        };

        const colors = severityColors[item.severity];

        return (
          <View style={[styles.card, { backgroundColor: colors.bg }]}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={colors.icon as any}
                size={24}
                color={colors.text}
              />
              <Text style={[styles.title, { color: colors.text }]}>
                {item.item_name}
              </Text>
              {!item.is_resolved && (
                <View style={[styles.badge, { backgroundColor: colors.text }]}>
                  <Text style={[styles.badgeText, { color: colors.bg }]}>
                    {item.severity}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.message, { color: colors.text }]}>
              {item.alert_message}
            </Text>

            {!item.is_resolved && (
              <TouchableOpacity
                style={[styles.resolve, { backgroundColor: colors.text }]}
                onPress={() => handleResolve(item)}
              >
                <Ionicons name="checkmark-circle" size={16} color={colors.bg} />
                <Text style={[styles.resolveText, { color: colors.bg }]}>
                  Resolve Alert
                </Text>
              </TouchableOpacity>
            )}

            {item.is_resolved && (
              <View style={styles.resolvedBadge}>
                <Ionicons name="checkmark-done" size={16} color="#388E3C" />
                <Text style={styles.resolvedText}>Resolved</Text>
              </View>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="shield-checkmark-outline" size={64} color="#388E3C" />
          <Text style={styles.emptyText}>No active alerts</Text>
          <Text style={styles.emptySubtext}>
            All inventory levels are good!
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  resolve: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  resolveText: {
    fontSize: 14,
    fontWeight: "600",
  },
  resolvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resolvedText: {
    fontSize: 14,
    color: "#388E3C",
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#388E3C",
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#81C784",
    marginTop: 8,
    textAlign: "center",
  },
});
