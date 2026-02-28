import { equipmentAPI, getImageUrl } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Equipment {
  id: number;
  name: string;
  type: string;
  description: string;
  model_number: string;
  serial_number: string;
  equipment_image: string;
  status: "available" | "in_use" | "maintenance";
}

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadEquipment = async () => {
    try {
      const response = await equipmentAPI.getAll();
      setEquipment(response.data.equipment);
      setFilteredEquipment(response.data.equipment);
    } catch (error) {
      console.error("Error loading equipment:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  useEffect(() => {
    let filtered = equipment;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    setFilteredEquipment(filtered);
  }, [searchQuery, filterStatus, equipment]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEquipment();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "#4caf50";
      case "in_use":
        return "#ff9800";
      case "maintenance":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return "checkmark-circle";
      case "in_use":
        return "time";
      case "maintenance":
        return "construct";
      default:
        return "help-circle";
    }
  };

  const renderEquipmentCard = ({ item }: { item: Equipment }) => (
    <TouchableOpacity
      style={styles.equipmentCard}
      onPress={() => router.push(`/equipment/${item.id}` as any)}
    >
      {item.equipment_image ? (
        <Image
          source={{ uri: getImageUrl(item.equipment_image)! }}
          style={styles.equipmentImage}
          onError={(error) => {
            console.log("Image load error:", error.nativeEvent.error);
          }}
        />
      ) : (
        <View style={styles.equipmentImagePlaceholder}>
          <Ionicons name="flask" size={40} color="#ccc" />
        </View>
      )}

      <View style={styles.equipmentInfo}>
        <Text style={styles.equipmentName}>{item.name}</Text>
        <Text style={styles.equipmentType}>{item.type}</Text>

        {item.model_number && (
          <Text style={styles.equipmentModel}>Model: {item.model_number}</Text>
        )}

        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.replace("_", " ")}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#26CCC2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Bar */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search equipment..."
            placeholderTextColor="#000000ff"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus("all")}
          >
            <Text
              style={[
                styles.filterText,
                filterStatus === "all" && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === "available" && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus("available")}
          >
            <Text
              style={[
                styles.filterText,
                filterStatus === "available" && styles.filterTextActive,
              ]}
            >
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === "in_use" && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus("in_use")}
          >
            <Text
              style={[
                styles.filterText,
                filterStatus === "in_use" && styles.filterTextActive,
              ]}
            >
              In Use
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === "maintenance" && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus("maintenance")}
          >
            <Text
              style={[
                styles.filterText,
                filterStatus === "maintenance" && styles.filterTextActive,
              ]}
            >
              Maintenance
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredEquipment}
          renderItem={renderEquipmentCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="flask-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No equipment found</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16, // ✅ keep side spacing
    marginTop: 8, // ✅ small controlled gap
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButtonActive: {
    backgroundColor: "#26CCC2",
    borderColor: "#26CCC2",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  equipmentCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  equipmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  equipmentImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  equipmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  equipmentType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  equipmentModel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
});
