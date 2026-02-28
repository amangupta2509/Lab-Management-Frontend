import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/store/authStore";
import { userAPI, getImageUrl } from "@/lib/api"; // ← Import getImageUrl

export default function AdminProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    department: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data);
      setEditData({
        name: response.data.user.name,
        phone: response.data.user.phone || "",
        department: response.data.user.department || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant photo library access");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append("profile_image", {
        uri,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);

      await userAPI.uploadImage(formData);
      Alert.alert("Success", "Profile image updated");
      loadProfile();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to upload image"
      );
    }
  };

  const handleSaveProfile = async () => {
    if (!editData.name.trim()) {
      Alert.alert("Required", "Name is required");
      return;
    }

    setIsSaving(true);
    try {
      await userAPI.updateProfile(editData);
      setUser({
        ...user!,
        name: editData.name,
        phone: editData.phone,
        department: editData.department,
      });
      Alert.alert("Success", "Profile updated successfully");
      setShowEditModal(false);
      loadProfile();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      Alert.alert("Required", "Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setIsSaving(true);
    try {
      await userAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      Alert.alert("Success", "Password changed successfully");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to change password"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handleImagePick}
        >
          {profile?.user?.profile_image ? (
            <Image
              source={{
                uri: getImageUrl(profile.user.profile_image)!,
              }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={48} color="#ccc" />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#E53935" />
          <Text style={styles.roleText}>ADMINISTRATOR</Text>
        </View>
      </View>

      {/* Statistics */}
      {profile?.statistics && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={32} color="#E53935" />
              <Text style={styles.statValue}>
                {profile.statistics.activity.total_hours}
              </Text>
              <Text style={styles.statLabel}>Work Hours</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={32} color="#E53935" />
              <Text style={styles.statValue}>
                {profile.statistics.bookings.total_bookings}
              </Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flask-outline" size={32} color="#E53935" />
              <Text style={styles.statValue}>
                {profile.statistics.usage.total_usage_sessions}
              </Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="print-outline" size={32} color="#E53935" />
              <Text style={styles.statValue}>
                {profile.statistics.prints.total_prints}
              </Text>
              <Text style={styles.statLabel}>Prints</Text>
            </View>
          </View>
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowEditModal(true)}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="person-outline" size={20} color="#2196F3" />
          </View>
          <Text style={styles.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowPasswordModal(true)}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#2196F3" />
          </View>
          <Text style={styles.menuText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View
            style={[styles.menuIconContainer, { backgroundColor: "#ffebee" }]}
          >
            <Ionicons name="log-out-outline" size={20} color="#E53935" />
          </View>
          <Text style={[styles.menuText, { color: "#E53935" }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={editData.name}
                onChangeText={(text) =>
                  setEditData({ ...editData, name: text })
                }
                placeholder="Enter your name"
                placeholderTextColor="#000000ff"
              />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editData.phone}
                onChangeText={(text) =>
                  setEditData({ ...editData, phone: text })
                }
                placeholder="Enter phone number"
                placeholderTextColor="#000000ff"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.input}
                value={editData.department}
                onChangeText={(text) =>
                  setEditData({ ...editData, department: text })
                }
                placeholder="Enter department"
                placeholderTextColor="#000000ff"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, currentPassword: text })
                }
                placeholder="Enter current password"
                placeholderTextColor="#000000ff"
                secureTextEntry
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, newPassword: text })
                }
                placeholder="Enter new password"
                placeholderTextColor="#000000ff"
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, confirmPassword: text })
                }
                placeholder="Confirm new password"
                placeholderTextColor="#000000ff"
                secureTextEntry
              />

              <Text style={styles.passwordHint}>
                Password must be at least 8 characters long
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Changing..." : "Change Password"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  imageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#fde3e3ff",
    borderRadius: 16,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    color: "#E53935",
    fontWeight: "700",
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  menuSection: {
    padding: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
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
    maxHeight: "80%",
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
  modalBody: {
    padding: 20,
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
  passwordHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
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
    backgroundColor: "#2196F3",
  },
  saveButtonDisabled: {
    backgroundColor: "#90caf9",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
