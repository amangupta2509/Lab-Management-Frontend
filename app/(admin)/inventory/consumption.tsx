import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";

export default function Consumption() {
  const [form, setForm] = useState({
    project_id: "",
    inventory_type: "",
    item_id: "",
    quantity: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    // Validation
    if (
      !form.project_id ||
      !form.inventory_type ||
      !form.item_id ||
      !form.quantity
    ) {
      Alert.alert("Required", "Please fill in all fields");
      return;
    }

    if (isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) {
      Alert.alert("Invalid", "Quantity must be a positive number");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/inventory/consume", {
        project_id: Number(form.project_id),
        inventory_type: form.inventory_type.toUpperCase(),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
      });

      Alert.alert("Success", "Inventory consumed successfully");

      // Reset form
      setForm({
        project_id: "",
        inventory_type: "",
        item_id: "",
        quantity: "",
      });
    } catch (error: any) {
      console.error("❌ Consumption Error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to consume inventory"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="link" size={32} color="#E53935" />
        <Text style={styles.headerTitle}>Consumption Mapping</Text>
        <Text style={styles.headerSubtitle}>
          Link inventory usage to specific projects
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Project ID *</Text>
        <TextInput
          placeholder="Enter project ID"
          style={styles.input}
          placeholderTextColor="#999"
          value={form.project_id}
          onChangeText={(v) => setForm({ ...form, project_id: v })}
          keyboardType="numeric"
          editable={!isSubmitting}
        />

        <Text style={styles.label}>Inventory Type *</Text>
        <TextInput
          placeholder="LAB or NGS"
          style={styles.input}
          placeholderTextColor="#999"
          value={form.inventory_type}
          onChangeText={(v) => setForm({ ...form, inventory_type: v })}
          autoCapitalize="characters"
          editable={!isSubmitting}
        />

        <Text style={styles.label}>Item ID *</Text>
        <TextInput
          placeholder="Enter item ID"
          style={styles.input}
          placeholderTextColor="#999"
          value={form.item_id}
          onChangeText={(v) => setForm({ ...form, item_id: v })}
          keyboardType="numeric"
          editable={!isSubmitting}
        />

        <Text style={styles.label}>Quantity *</Text>
        <TextInput
          placeholder="Enter quantity to consume"
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#999"
          value={form.quantity}
          onChangeText={(v) => setForm({ ...form, quantity: v })}
          editable={!isSubmitting}
        />

        <TouchableOpacity
          style={[styles.submit, isSubmitting && styles.submitDisabled]}
          onPress={submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitText}>Consume Inventory</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#1976D2" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            • Enter the Project ID that's consuming inventory{"\n"}• Select
            inventory type (LAB or NGS){"\n"}• Enter the specific Item ID being
            consumed{"\n"}• Specify the quantity used
          </Text>
        </View>
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  form: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
  },
  submit: {
    backgroundColor: "#E53935",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitDisabled: {
    backgroundColor: "#FFCDD2",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#1565C0",
    lineHeight: 20,
  },
});
