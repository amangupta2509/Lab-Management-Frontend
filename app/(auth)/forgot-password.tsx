import { authAPI } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null); // For development only

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      // 🔥 FIX: Send client type header
      const response = await authAPI.forgotPassword(email);

      // 🔥 Store debug info if provided (development only)
      if (response.data.debug) {
        setDebugInfo(response.data.debug);
        console.log("🔧 Debug Info:", response.data.debug);
      }

      setEmailSent(true);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to send reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={80} color="#2196F3" />
          </View>

          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            If an account exists with{" "}
            <Text style={styles.emailText}>{email}</Text>, you will receive
            password reset instructions shortly.
          </Text>

          <Text style={styles.instructionText}>
            Please check your inbox and spam folder. Tap the link in the email
            to open the app.
          </Text>

          {__DEV__ && debugInfo && (
            <View style={styles.debugBox}>
              <Text style={styles.debugTitle}>🔧 Debug Info (Dev Only)</Text>
              <Text style={styles.debugText}>Token: {debugInfo.token}</Text>
              <TouchableOpacity
                style={styles.debugButton}
                onPress={() => {
                  router.push(
                    `/(auth)/reset-password?token=${debugInfo.token}` as any
                  );
                }}
              >
                <Text style={styles.debugButtonText}>Test Reset (Dev)</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Ionicons name="arrow-back" size={20} color="#2196F3" />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => setEmailSent(false)}
          >
            <Text style={styles.resendButtonText}>
              Didn't receive email? Try again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={80} color="#2196F3" />
          </View>

          {/* Header */}
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Don't worry! Enter your email address and we'll send you
            instructions to reset your password.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#000000ff"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#666"
            />
            <Text style={styles.helpText}>
              You'll receive an email with a link to reset your password
            </Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    marginBottom: 20,
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
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 24,
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
    backgroundColor: "#90caf9",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  emailText: {
    color: "#2196F3",
    fontWeight: "600",
  },
  instructionText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 32,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    paddingVertical: 12,
  },
  resendButtonText: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  // 🔥 Debug styles (development only)
  debugBox: {
    backgroundColor: "#fff3cd",
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    width: "100%",
    borderWidth: 2,
    borderColor: "#ffc107",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  debugButton: {
    backgroundColor: "#ffc107",
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  debugButtonText: {
    color: "#000",
    textAlign: "center",
    fontWeight: "600",
  },
});
