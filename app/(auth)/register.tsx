import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    department: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isLoading, error, clearError } = useAuthStore();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    clearError();

    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    try {
      // 🔥 SEND ONLY REQUIRED FIELDS
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
    } catch (err) {
      console.log("Register error:", err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Ionicons name="close-circle" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#000000ff"
                value={formData.name}
                onChangeText={(v) => updateField("name", v)}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor="#000000ff"
                value={formData.email}
                onChangeText={(v) => updateField("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone (UI only) */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (optional)"
                placeholderTextColor="#000000ff"
                value={formData.phone}
                onChangeText={(v) => updateField("phone", v)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Department (UI only) */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="business-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Department (optional)"
                placeholderTextColor="#000000ff"
                value={formData.department}
                onChangeText={(v) => updateField("department", v)}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password *"
                placeholderTextColor="#000000ff"
                value={formData.password}
                onChangeText={(v) => updateField("password", v)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password *"
                placeholderTextColor="#000000ff"
                value={formData.confirmPassword}
                onChangeText={(v) => updateField("confirmPassword", v)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                <Ionicons
                  name={
                    showConfirmPassword
                      ? "eye-outline"
                      : "eye-off-outline"
                  }
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordHint}>
              Password must be at least 8 characters long
            </Text>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already have an account?{" "}
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 20, paddingTop: 60 },

  header: { marginBottom: 40 },
  backButton: { marginBottom: 20 },

  title: { fontSize: 28, fontWeight: "bold", color: "#212121" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 8 },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: { color: "#f44336", flex: 1 },

  form: { width: "100%" },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  inputIcon: { marginRight: 12 },

  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#212121",
  },

  passwordHint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 24,
    marginTop: -8,
  },

  registerButton: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  registerButtonDisabled: { backgroundColor: "#90caf9" },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  loginText: { color: "#666", fontSize: 14 },
  loginLink: { color: "#2196F3", fontSize: 14, fontWeight: "600" },
});
