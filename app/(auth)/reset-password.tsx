import { authAPI } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
  });

  useEffect(() => {
    if (!token) {
      Alert.alert("Invalid Link", "This password reset link is invalid.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
      return;
    }

    // Validate token presence (actual validation happens on backend during reset)
    setTokenValid(true);
    setIsValidatingToken(false);
  }, [token]);

  useEffect(() => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
    });
  }, [password]);

  const isPasswordValid = (): boolean => {
    return (
      passwordStrength.hasMinLength &&
      passwordStrength.hasLowercase &&
      passwordStrength.hasUppercase &&
      passwordStrength.hasNumber
    );
  };

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Required", "Please fill in all fields");
      return;
    }

    if (!isPasswordValid()) {
      Alert.alert(
        "Invalid Password",
        "Please ensure your password meets all requirements"
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword(token as string, password);

      if (response.data.success) {
        Alert.alert(
          "Success!",
          "Your password has been reset successfully. You can now log in with your new password.",
          [
            {
              text: "Go to Login",
              onPress: () => router.replace("/(auth)/login"),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to reset password";

      if (
        errorMessage.toLowerCase().includes("expired") ||
        errorMessage.toLowerCase().includes("invalid")
      ) {
        Alert.alert(
          "Link Expired",
          "This password reset link has expired or is invalid. Please request a new one.",
          [
            {
              text: "Request New Link",
              onPress: () => router.replace("/(auth)/forgot-password"),
            },
          ]
        );
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Validating reset link...</Text>
      </View>
    );
  }

  if (!tokenValid) {
    return null; // Alert will redirect
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={80} color="#2196F3" />
          </View>

          {/* Header */}
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Create a strong new password for your account
          </Text>

          {/* New Password Input */}
          <Text style={styles.inputLabel}>New Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#000000ff"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password must contain:</Text>

            <View style={styles.requirementRow}>
              <Ionicons
                name={
                  passwordStrength.hasMinLength
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={passwordStrength.hasMinLength ? "#4caf50" : "#ccc"}
              />
              <Text
                style={[
                  styles.requirementText,
                  passwordStrength.hasMinLength && styles.requirementMet,
                ]}
              >
                At least 8 characters
              </Text>
            </View>

            <View style={styles.requirementRow}>
              <Ionicons
                name={
                  passwordStrength.hasLowercase
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={passwordStrength.hasLowercase ? "#4caf50" : "#ccc"}
              />
              <Text
                style={[
                  styles.requirementText,
                  passwordStrength.hasLowercase && styles.requirementMet,
                ]}
              >
                One lowercase letter (a-z)
              </Text>
            </View>

            <View style={styles.requirementRow}>
              <Ionicons
                name={
                  passwordStrength.hasUppercase
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={passwordStrength.hasUppercase ? "#4caf50" : "#ccc"}
              />
              <Text
                style={[
                  styles.requirementText,
                  passwordStrength.hasUppercase && styles.requirementMet,
                ]}
              >
                One uppercase letter (A-Z)
              </Text>
            </View>

            <View style={styles.requirementRow}>
              <Ionicons
                name={
                  passwordStrength.hasNumber
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={passwordStrength.hasNumber ? "#4caf50" : "#ccc"}
              />
              <Text
                style={[
                  styles.requirementText,
                  passwordStrength.hasNumber && styles.requirementMet,
                ]}
              >
                One number (0-9)
              </Text>
            </View>
          </View>

          {/* Confirm Password Input */}
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              placeholderTextColor="#000000ff"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Password Match Indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchIndicator}>
              {password === confirmPassword ? (
                <View style={styles.matchRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                  <Text style={styles.matchText}>Passwords match</Text>
                </View>
              ) : (
                <View style={styles.matchRow}>
                  <Ionicons name="close-circle" size={16} color="#f44336" />
                  <Text style={styles.mismatchText}>Passwords don't match</Text>
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isPasswordValid() ||
                password !== confirmPassword ||
                isLoading) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={
              !isPasswordValid() || password !== confirmPassword || isLoading
            }
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.submitButtonText}>Reset Password</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => router.replace("/(auth)/login")}
            disabled={isLoading}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212121",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#212121",
  },
  eyeIcon: {
    padding: 8,
  },
  requirementsContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: "#999",
  },
  requirementMet: {
    color: "#4caf50",
    fontWeight: "500",
  },
  matchIndicator: {
    marginBottom: 24,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchText: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "500",
  },
  mismatchText: {
    fontSize: 14,
    color: "#f44336",
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#2196F3",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#bdbdbd",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backToLogin: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backToLoginText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "600",
  },
});
