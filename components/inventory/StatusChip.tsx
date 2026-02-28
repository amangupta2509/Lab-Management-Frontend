import { View, Text, StyleSheet } from "react-native";
import React from "react";

interface StatusChipProps {
  label: string;
  type?:
    | "ok"
    | "warning"
    | "danger"
    | "info"
    | "success";
}

export default function StatusChip({
  label,
  type = "info",
}: StatusChipProps) {
  return (
    <View style={[styles.chip, styles[type]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles: any = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },

  text: {
    fontSize: 12,
    fontWeight: "600",
  },

  ok: {
    backgroundColor: "#E8F5E9",
    color: "#388E3C",
  },
  success: {
    backgroundColor: "#E8F5E9",
    color: "#2E7D32",
  },
  warning: {
    backgroundColor: "#FFF3E0",
    color: "#EF6C00",
  },
  danger: {
    backgroundColor: "#FFEBEE",
    color: "#C62828",
  },
  info: {
    backgroundColor: "#E3F2FD",
    color: "#1565C0",
  },
});
