import { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator,
  Modal, TextInput, ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { labInventoryAPI } from "@/lib/inventoryApi";

interface LabInventoryItem {
  id: number;
  item_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  location?: string;
  reorder_status: "OK" | "LOW" | "REORDER_REQUIRED";
}

export default function LabInventory() {
  const [data, setData] = useState<LabInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LabInventoryItem | null>(null);
  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    current_stock: "",
    minimum_stock: "",
    unit: "",
    location: "",
  });

  const loadData = async () => {
    try {
      const res = await labInventoryAPI.getAll();
      setData(res.data.items || []);
    } catch (error) {
      Alert.alert("Error", "Unable to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      item_name: "",
      category: "",
      current_stock: "",
      minimum_stock: "",
      unit: "",
      location: "",
    });
    setShowModal(true);
  };

  const handleEdit = (item: LabInventoryItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      current_stock: item.current_stock.toString(),
      minimum_stock: item.minimum_stock.toString(),
      unit: item.unit,
      location: item.location || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.item_name || !formData.category || !formData.current_stock) {
      Alert.alert("Required", "Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        item_name: formData.item_name,
        category: formData.category,
        current_stock: parseFloat(formData.current_stock),
        minimum_stock: parseFloat(formData.minimum_stock || "0"),
        unit: formData.unit,
        location: formData.location,
      };

      if (editingItem) {
        await labInventoryAPI.update(editingItem.id, payload);
        Alert.alert("Success", "Item updated successfully");
      } else {
        await labInventoryAPI.create(payload);
        Alert.alert("Success", "Item added successfully");
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to save item");
    }
  };

  const handleDelete = (item: LabInventoryItem) => {
    Alert.alert("Delete Item", `Delete "${item.item_name}"?`, [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await labInventoryAPI.delete(item.id);
            Alert.alert("Success", "Item deleted");
            loadData();
          } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#E53935" />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lab Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        style={styles.list}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const reorder = item.reorder_status === "REORDER_REQUIRED";
          const low = item.reorder_status === "LOW";

          return (
            <View style={[styles.card, reorder && styles.reorder, low && styles.low]}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.item_name}</Text>
                <Ionicons
                  name={reorder || low ? "alert-circle" : "checkmark-circle"}
                  size={20}
                  color={reorder ? "#D32F2F" : low ? "#FB8C00" : "#388E3C"}
                />
              </View>

              <Text style={styles.meta}>
                {item.category} · {item.current_stock} {item.unit}
              </Text>

              {item.location && (
                <Text style={styles.meta}>Location: {item.location}</Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Ionicons name="create" size={18} color="#1976D2" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Ionicons name="trash" size={18} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="flask-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No inventory items</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? "Edit Item" : "Add New Item"}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.item_name}
                onChangeText={(v) => setFormData({ ...formData, item_name: v })}
                placeholder="e.g., Tris Buffer"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Category *</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(v) => setFormData({ ...formData, category: v })}
                placeholder="e.g., Reagent"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Current Stock *</Text>
              <TextInput
                style={styles.input}
                value={formData.current_stock}
                onChangeText={(v) => setFormData({ ...formData, current_stock: v })}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Minimum Stock</Text>
              <TextInput
                style={styles.input}
                value={formData.minimum_stock}
                onChangeText={(v) => setFormData({ ...formData, minimum_stock: v })}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Unit *</Text>
              <TextInput
                style={styles.input}
                value={formData.unit}
                onChangeText={(v) => setFormData({ ...formData, unit: v })}
                placeholder="e.g., mL, g, units"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(v) => setFormData({ ...formData, location: v })}
                placeholder="e.g., Fridge A3"
                placeholderTextColor="#999"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#212121" },
  addButton: {
    backgroundColor: "#E53935",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  list: { flex: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  reorder: {
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
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#212121", flex: 1 },
  meta: { fontSize: 13, color: "#555", marginTop: 4 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 10,
  },
  empty: { alignItems: "center", padding: 48, marginTop: 48 },
  emptyText: { fontSize: 16, color: "#999", marginTop: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#212121" },
  modalBody: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: { fontSize: 16, color: "#666", fontWeight: "600" },
  saveButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#E53935",
  },
  saveButtonText: { fontSize: 16, color: "#fff", fontWeight: "600" },
});