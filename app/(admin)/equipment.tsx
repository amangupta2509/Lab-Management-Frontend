import { equipmentAPI, getImageUrl } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Equipment {
  id: number;
  name: string;
  type: string;
  description: string;
  model_number: string;
  serial_number: string;
  equipment_image: string;
  status: "available" | "in_use" | "maintenance" | "deleted";
}

export default function AdminEquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false); // Track if image was changed

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    model_number: "",
    serial_number: "",
    status: "available" as Equipment["status"],
  });

  const loadEquipment = async () => {
    try {
      const response = await equipmentAPI.getAll();
      setEquipment(response.data.equipment);
      setFilteredEquipment(response.data.equipment);
    } catch (error) {
      console.error("Error loading equipment:", error);
      Alert.alert("Error", "Failed to load equipment");
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

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    setFilteredEquipment(filtered);
  }, [searchQuery, filterStatus, equipment]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEquipment();
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant photo library access");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const handleAddEquipment = async () => {
    if (!formData.name || !formData.type) {
      Alert.alert("Error", "Please provide equipment name and type");
      return;
    }

    setIsSaving(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("type", formData.type);
      data.append("description", formData.description);
      data.append("model_number", formData.model_number);
      data.append("serial_number", formData.serial_number);

      // Add image if selected
      if (selectedImage) {
        data.append("image", {
          uri: selectedImage,
          type: "image/jpeg",
          name: "equipment.jpg",
        } as any);
      }

      await equipmentAPI.create(data);
      Alert.alert("Success", "Equipment added successfully");
      setShowAddModal(false);
      resetForm();
      loadEquipment();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add equipment"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEquipment = async () => {
    if (!selectedEquipment) return;

    setIsSaving(true);
    try {
      // Use FormData for update to support image upload
      const data = new FormData();
      data.append("name", formData.name);
      data.append("type", formData.type);
      data.append("description", formData.description);
      data.append("model_number", formData.model_number);
      data.append("serial_number", formData.serial_number);
      data.append("status", formData.status);

      // Add new image only if it was changed
      if (imageChanged && selectedImage) {
        data.append("image", {
          uri: selectedImage,
          type: "image/jpeg",
          name: "equipment.jpg",
        } as any);
      }

      await equipmentAPI.update(selectedEquipment.id, data);
      Alert.alert("Success", "Equipment updated successfully");
      setShowEditModal(false);
      setSelectedEquipment(null);
      resetForm();
      loadEquipment();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update equipment"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEquipment = (item: Equipment) => {
    Alert.alert(
      "Delete Equipment",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await equipmentAPI.delete(item.id);
              Alert.alert("Success", "Equipment deleted successfully");
              loadEquipment();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to delete equipment"
              );
            }
          },
        },
      ]
    );
  };

  const openEditModal = (item: Equipment) => {
    setSelectedEquipment(item);
    setFormData({
      name: item.name,
      type: item.type,
      description: item.description || "",
      model_number: item.model_number || "",
      serial_number: item.serial_number || "",
      status: item.status,
    });
    // Set existing image for preview
    if (item.equipment_image) {
      setSelectedImage(getImageUrl(item.equipment_image)!);
    } else {
      setSelectedImage(null);
    }
    setImageChanged(false);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      model_number: "",
      serial_number: "",
      status: "available",
    });
    setSelectedImage(null);
    setImageChanged(false);
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

  const renderEquipmentCard = ({ item }: { item: Equipment }) => (
    <View style={styles.equipmentCard}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => router.push(`/equipment/${item.id}/analytics` as any)}
      >
        {item.equipment_image ? (
          <Image
            source={{ uri: getImageUrl(item.equipment_image)! }}
            style={styles.equipmentImage}
          />
        ) : (
          <View style={styles.equipmentImagePlaceholder}>
            <Ionicons name="flask" size={32} color="#ccc" />
          </View>
        )}

        <View style={styles.equipmentInfo}>
          <Text style={styles.equipmentName}>{item.name}</Text>
          <Text style={styles.equipmentType}>{item.type}</Text>
          {item.model_number && (
            <Text style={styles.equipmentModel}>
              Model: {item.model_number}
            </Text>
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}20` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status.replace("_", " ")}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={15} color="#000000ff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: "#E53935" }]}
          onPress={() => handleDeleteEquipment(item)}
        >
          <Ionicons name="trash-outline" size={15} color="#E53935" />
          <Text style={[styles.actionButtonText, { color: "#E53935" }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Equipment List */}
      <FlatList
        data={filteredEquipment}
        renderItem={renderEquipmentCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search equipment..."
                  placeholderTextColor="#000000ff"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContent}
                style={styles.filterContainer}
              >
                {["all", "available", "in_use", "maintenance"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterTab,
                      filterStatus === status && styles.filterTabActive,
                    ]}
                    onPress={() => setFilterStatus(status)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filterStatus === status && styles.filterTextActive,
                      ]}
                    >
                      {status === "all" ? "All" : status.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal || showEditModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showAddModal ? "Add Equipment" : "Edit Equipment"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedEquipment(null);
                    resetForm();
                  }}
                >
                  <Ionicons name="close" size={24} color="#212121" />
                </TouchableOpacity>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScrollContent}
              >
                {/* Image Upload Section - Show for both Add and Edit */}
                <Text style={styles.inputLabel}>Equipment Image</Text>
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={handleImagePick}
                >
                  {selectedImage ? (
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <View style={styles.imageUploadPlaceholder}>
                      <Ionicons name="camera-outline" size={40} color="#666" />
                      <Text style={styles.imageUploadText}>
                        {showEditModal
                          ? "Tap to change image"
                          : "Tap to select image"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {showEditModal && imageChanged && (
                  <View style={styles.imageChangeNotice}>
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color="#2196F3"
                    />
                    <Text style={styles.imageChangeNoticeText}>
                      {selectedImage
                        ? "New image will be uploaded"
                        : "Current image will be kept"}
                    </Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Equipment name"
                  placeholderTextColor="#000000ff"
                />

                <Text style={styles.inputLabel}>Type *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.type}
                  onChangeText={(text) =>
                    setFormData({ ...formData, type: text })
                  }
                  placeholder="Equipment type"
                  placeholderTextColor="#000000ff"
                />

                <Text style={styles.inputLabel}>Model Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.model_number}
                  onChangeText={(text) =>
                    setFormData({ ...formData, model_number: text })
                  }
                  placeholder="Model number"
                  placeholderTextColor="#000000ff"
                />

                <Text style={styles.inputLabel}>Serial Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.serial_number}
                  onChangeText={(text) =>
                    setFormData({ ...formData, serial_number: text })
                  }
                  placeholder="Serial number"
                  placeholderTextColor="#000000ff"
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Description"
                  placeholderTextColor="#000000ff"
                  multiline
                  numberOfLines={4}
                />

                {showEditModal && (
                  <>
                    <Text style={styles.inputLabel}>Status</Text>
                    <View style={styles.statusSelector}>
                      {(["available", "in_use", "maintenance"] as const).map(
                        (status) => (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.statusOption,
                              formData.status === status &&
                                styles.statusOptionActive,
                            ]}
                            onPress={() => setFormData({ ...formData, status })}
                          >
                            <Text
                              style={[
                                styles.statusOptionText,
                                formData.status === status &&
                                  styles.statusOptionTextActive,
                              ]}
                            >
                              {status.replace("_", " ")}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedEquipment(null);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    isSaving && styles.saveButtonDisabled,
                  ]}
                  onPress={
                    showAddModal ? handleAddEquipment : handleEditEquipment
                  }
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving
                      ? "Saving..."
                      : showAddModal
                      ? "Add Equipment"
                      : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
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
  },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    gap: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: "#E53935",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    borderRadius: 10,
    backgroundColor: "#ffffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },

  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },

  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: "#E53935",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  equipmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: "row",
    marginBottom: 12,
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
  filterWrapper: {
    paddingBottom: 8,
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000ff",
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: "#000000ff",
    fontWeight: "600",
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },

  modalScrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  statusSelector: {
    flexDirection: "row",
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  statusOptionActive: {
    backgroundColor: "#E53935",
  },
  statusOptionText: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
  },
  statusOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
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
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#E53935",
  },
  saveButtonDisabled: {
    backgroundColor: "#E53935",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  imageUploadButton: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 16,
  },
  imageUploadPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  imageUploadText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 16,
    gap: 6,
  },
  removeImageText: {
    fontSize: 14,
    color: "#E53935",
    fontWeight: "600",
  },
  imageChangeNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  imageChangeNoticeText: {
    fontSize: 13,
    color: "#1976D2",
    flex: 1,
  },
});
