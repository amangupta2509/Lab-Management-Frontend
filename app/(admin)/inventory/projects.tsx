import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";

interface Project {
  id: number;
  client_name: string;
  project_type: string;
  sample_size: number;
  library_status: string;
  run_status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = async () => {
    try {
      const res = await api.get("/inventory/projects");
      console.log("📦 Projects Response:", res.data);
      setProjects(res.data.projects || []);
    } catch (error: any) {
      console.error("❌ Projects Error:", error);
      Alert.alert("Error", "Failed to load projects");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={projects}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flask" size={24} color="#E53935" />
            <Text style={styles.title}>{item.client_name}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.meta}>
              {item.project_type} · {item.sample_size} samples
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusLabel}>Library:</Text>
              <Text
                style={[
                  styles.statusValue,
                  getStatusColor(item.library_status),
                ]}
              >
                {item.library_status}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusLabel}>Run:</Text>
              <Text
                style={[styles.statusValue, getStatusColor(item.run_status)]}
              >
                {item.run_status}
              </Text>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="flask-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No projects found</Text>
          <Text style={styles.emptySubtext}>
            Projects will appear here once created
          </Text>
        </View>
      }
    />
  );
}

const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("done")) {
    return { color: "#388E3C" };
  }
  if (s.includes("progress") || s.includes("pending")) {
    return { color: "#FB8C00" };
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
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  meta: {
    color: "#555",
    fontSize: 14,
    flex: 1,
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
    flex: 1,
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
