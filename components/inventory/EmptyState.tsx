import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function EmptyState({
  title = "No Data Found",
  message = "There is nothing to display here yet.",
  icon = "cube-outline",
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color="#BDBDBD" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#616161",
  },
  message: {
    marginTop: 6,
    fontSize: 13,
    color: "#9E9E9E",
    textAlign: "center",
  },
});
