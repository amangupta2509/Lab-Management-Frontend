import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface InventoryCardProps {
  title: string;
  subtitle?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightIconColor?: string;
  highlight?: "danger" | "warning" | "success";
  children?: React.ReactNode;
}

export default function InventoryCard({
  title,
  subtitle,
  rightIcon,
  rightIconColor = "#E53935",
  highlight,
  children,
}: InventoryCardProps) {
  return (
    <View
      style={[
        styles.card,
        highlight === "danger" && styles.danger,
        highlight === "warning" && styles.warning,
        highlight === "success" && styles.success,
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={22}
            color={rightIconColor}
          />
        )}
      </View>

      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  /* Highlight Borders */
  danger: {
    borderLeftWidth: 5,
    borderLeftColor: "#D32F2F",
  },
  warning: {
    borderLeftWidth: 5,
    borderLeftColor: "#FB8C00",
  },
  success: {
    borderLeftWidth: 5,
    borderLeftColor: "#388E3C",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  content: {
    marginTop: 10,
  },
});
