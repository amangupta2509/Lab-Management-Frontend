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
import { format } from "date-fns";
import api from "@/lib/api";

interface Transaction {
  id: number;
  transaction_type: string;
  quantity: number;
  inventory_type: string;
  reference_type: string;
  created_at: string;
  item_name?: string;
}

export default function Transactions() {
  const [logs, setLogs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get("/inventory/transactions");
      console.log("📦 Transactions Response:", res.data);
      setLogs(res.data.transactions || []);
    } catch (error: any) {
      console.error("❌ Transactions Error:", error);
      Alert.alert("Error", "Failed to load transactions");
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
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={logs}
      keyExtractor={(l) => l.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => {
        const isAddition =
          item.transaction_type.toLowerCase().includes("add") ||
          item.transaction_type.toLowerCase().includes("purchase");
        const isConsumption =
          item.transaction_type.toLowerCase().includes("consume") ||
          item.transaction_type.toLowerCase().includes("use");

        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={
                  isAddition
                    ? "add-circle"
                    : isConsumption
                      ? "remove-circle"
                      : "swap-horizontal"
                }
                size={24}
                color={
                  isAddition ? "#388E3C" : isConsumption ? "#D32F2F" : "#1976D2"
                }
              />
              <Text style={styles.title}>
                {item.transaction_type} {item.quantity}
              </Text>
            </View>

            <View style={styles.divider} />

            {item.item_name && (
              <View style={styles.infoRow}>
                <Ionicons name="cube-outline" size={16} color="#666" />
                <Text style={styles.meta}>{item.item_name}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="layers-outline" size={16} color="#666" />
              <Text style={styles.meta}>
                {item.inventory_type} | Ref: {item.reference_type}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.date}>
                {format(new Date(item.created_at), "MMM dd, yyyy · hh:mm a")}
              </Text>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySubtext}>
            Transaction history will appear here
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
    marginBottom: 8,
  },
  meta: {
    color: "#555",
    marginTop: 4,
    fontSize: 14,
  },
  date: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
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
