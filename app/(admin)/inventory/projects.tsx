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
