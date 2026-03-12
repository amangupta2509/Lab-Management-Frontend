import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { refreshBackendURL, getCurrentApiUrl } from "@/lib/api";
import axios from "axios";

/**
 * Connection Debug Component
 * Shows current backend URL and allows manual refresh
 * Only visible in development mode
 */
export default function ConnectionDebug() {
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "failed"
  >("unknown");
  const [backendInfo, setBackendInfo] = useState<any>(null);

  useEffect(() => {
    loadCurrentUrl();
  }, []);

  const loadCurrentUrl = () => {
    const url = getCurrentApiUrl();
    setCurrentUrl(url);
  };

  const testConnection = async () => {
    try {
      const healthUrl = currentUrl.replace("/api", "") + "/health";
      console.log("🧪 Testing connection to:", healthUrl);

      const response = await axios.get(healthUrl, { timeout: 5000 });

      if (response.data?.status === "healthy") {
        console.log("✅ Connection successful!");
        setConnectionStatus("connected");
        setBackendInfo(response.data);
        return true;
      } else {
        console.log("⚠️ Unexpected response:", response.data);
        setConnectionStatus("failed");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Connection test failed:", error.message);
      setConnectionStatus("failed");
      return false;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setConnectionStatus("unknown");

    try {
      const newUrl = await refreshBackendURL();
      setCurrentUrl(newUrl);

      // Test the new connection
      await testConnection();
    } catch (error) {
      console.error("Refresh failed:", error);
      setConnectionStatus("failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Only show in development mode
  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Toggle Button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(!isVisible)}
      >
        <Ionicons name={isVisible ? "eye-off" : "eye"} size={20} color="#fff" />
        <Text style={styles.toggleText}>{isVisible ? "Hide" : "Debug"}</Text>
      </TouchableOpacity>

      {/* Debug Panel */}
      {isVisible && (
        <ScrollView style={styles.panel}>
          <View style={styles.header}>
            <Ionicons name="bug" size={24} color="#2196F3" />
            <Text style={styles.title}>Connection Debug</Text>
          </View>

          {/* Current URL */}
          <View style={styles.section}>
            <Text style={styles.label}>Current Backend URL:</Text>
            <View style={styles.urlContainer}>
              <Text style={styles.url} numberOfLines={2}>
                {currentUrl}
              </Text>
              {connectionStatus === "connected" && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
              {connectionStatus === "failed" && (
                <Ionicons name="close-circle" size={20} color="#F44336" />
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.refreshButton]}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Refresh URL</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={testConnection}
              disabled={isRefreshing}
            >
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.buttonText}>Test Connection</Text>
            </TouchableOpacity>
          </View>

          {/* Backend Info */}
          {backendInfo && (
            <View style={styles.section}>
              <Text style={styles.label}>Backend Info:</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Status: {backendInfo.status}
                </Text>
                <Text style={styles.infoText}>
                  Version: {backendInfo.version}
                </Text>
                <Text style={styles.infoText}>
                  Platform: {backendInfo.platform}
                </Text>
                {backendInfo.server?.hostname && (
                  <Text style={styles.infoText}>
                    Hostname: {backendInfo.server.hostname}
                  </Text>
                )}
              </View>

              {/* Network Interfaces */}
              {backendInfo.server?.networkInterfaces && (
                <View style={styles.networkSection}>
                  <Text style={styles.label}>Available Network IPs:</Text>
                  {backendInfo.server.networkInterfaces.map(
                    (iface: any, index: number) => (
                      <View key={index} style={styles.networkItem}>
                        <Ionicons name="wifi" size={16} color="#666" />
                        <Text style={styles.networkText}>
                          {iface.name}: {iface.address}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              )}
            </View>
          )}

          {/* Status Message */}
          {connectionStatus === "failed" && (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={20} color="#F44336" />
              <Text style={styles.errorText}>
                Cannot connect to backend. Make sure the backend server is
                running and accessible from this device.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 9999,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toggleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  panel: {
    position: "absolute",
    bottom: 50,
    right: 0,
    width: 320,
    maxHeight: 500,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212121",
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  urlContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  url: {
    flex: 1,
    fontSize: 12,
    color: "#212121",
    fontFamily: "monospace",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButton: {
    backgroundColor: "#2196F3",
  },
  testButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#1565C0",
    fontFamily: "monospace",
  },
  networkSection: {
    marginTop: 12,
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  networkText: {
    fontSize: 11,
    color: "#666",
    fontFamily: "monospace",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: "#C62828",
  },
});
