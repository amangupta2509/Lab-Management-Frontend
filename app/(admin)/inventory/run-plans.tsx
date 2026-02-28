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
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="play-circle" size={24} color="#E53935" />
            <Text style={styles.title}>{item.unique_run_id}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="hardware-chip-outline" size={16} color="#666" />
            <Text style={styles.meta}>Client: {item.client_name || "—"}</Text>
            <Text style={styles.meta}>Project: {item.project_type || "—"}</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusLabel}>QC:</Text>
              <Text
                style={[styles.statusValue, getStatusColor(item.qc_status)]}
              >
                {item.qc_status}
              </Text>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="play-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No run plans found</Text>
          <Text style={styles.emptySubtext}>Run plans will appear here</Text>
        </View>
      }
    />
  );
}

const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("pass")) {
    return { color: "#388E3C" };
  }
  if (s.includes("progress") || s.includes("pending")) {
    return { color: "#FB8C00" };
  }
  if (s.includes("fail")) {
    return { color: "#D32F2F" };
  }
  return { color: "#1976D2" };
};

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
    backgroundColor: "#fff",
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
