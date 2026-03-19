import { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";

interface RunPlan {
  id: number;
  unique_run_id: string;
  qc_status: string;
  run_status: string;
  run_date: string;
  project_type?: string;
  client_name?: string;
  created_at: string;
}

export default function RunPlans() {
  const [runs, setRuns] = useState<RunPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get("/inventory/runs");
      console.log("📦 Run Plans Response:", res.data);
      setRuns(res.data.runs || []);
    } catch (error: any) {
      console.error("❌ Run Plans Error:", error);
      Alert.alert("Error", "Failed to load run plans");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={styles.loadingText}>Loading run plans...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={runs}
      keyExtractor={(r) => r.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />

  load
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
    color: "#212121",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  meta: {
    marginTop: 4,
    color: "#555",
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statusBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  statusValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 8,
    textAlign: "center",
  },
});
