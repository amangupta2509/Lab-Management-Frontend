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

interface NGSItem {
  id: number;
  item_name: string;
  manufacturer: string;
  catalog_number: string;
  quantity_in_stock: number;
  unit: string;
  reorder_status: "OK" | "LOW" | "REORDER_REQUIRED";
}

export default function NGSInventory() {
  const [items, setItems] = useState<NGSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get("/inventory/ngs");
      console.log("📦 NGS Response:", res.data);
      setItems(res.data.items || []);
    } catch (error: any) {
      console.error("❌ NGS Error:", error);
      Alert.alert("Error", "Failed to load NGS inventory");
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
        <Text style={styles.loadingText}>Loading NGS inventory...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(i) => i.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => {
        const critical = item.reorder_status === "REORDER_REQUIRED";
        const low = item.reorder_status === "LOW";

        return (
          <View
            style={[
              styles.card,
              critical && styles.critical,
              low && styles.low,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.item_name}</Text>
              <Ionicons
                name={critical || low ? "alert-circle" : "checkmark-circle"}
                size={20}
                color={critical ? "#D32F2F" : low ? "#FB8C00" : "#388E3C"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color="#666" />
              <Text style={styles.meta}>{item.manufacturer}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="barcode-outline" size={16} color="#666" />
              <Text style={styles.meta}>{item.catalog_number}</Text>
            </View>

            <View style={styles.stockContainer}>
              <Text style={styles.stockLabel}>Stock:</Text>
              <Text
                style={[
                  styles.stock,
                  critical && styles.stockCritical,
                  low && styles.stockLow,
                ]}
              >
                {item.quantity_in_stock} {item.unit}
              </Text>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="git-network-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No NGS inventory items</Text>
          <Text style={styles.emptySubtext}>NGS items will appear here</Text>
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
  critical: {
    borderLeftWidth: 5,
    borderLeftColor: "#D32F2F",
  },
  low: {
    borderLeftWidth: 5,
    borderLeftColor: "#FB8C00",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  meta: {
    color: "#555",
    fontSize: 14,
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  stockLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  stock: {
    fontSize: 14,
    fontWeight: "600",
    color: "#388E3C",
  },
  stockCritical: {
    color: "#D32F2F",
  },
  stockLow: {
    color: "#FB8C00",
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
