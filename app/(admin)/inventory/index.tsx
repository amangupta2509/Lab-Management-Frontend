import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const SECTIONS = [
  {
    title: "Projects & Samples",
    icon: "flask",
    route: "/(admin)/inventory/projects",
  },
  {
    title: "Lab Inventory",
    icon: "beaker",
    route: "/(admin)/inventory/lab-inventory",
  },
  {
    title: "NGS Inventory",
    icon: "git-network",
    route: "/(admin)/inventory/ngs-inventory",
  },
  {
    title: "Run Plans",
    icon: "play-circle",
    route: "/(admin)/inventory/run-plans",
  },
  {
    title: "Inventory Alerts",
    icon: "alert-circle",
    route: "/(admin)/inventory/alerts",
    danger: true,
  },
  {
    title: "Transactions",
    icon: "receipt",
    route: "/(admin)/inventory/transactions",
  },
  {
    title: "Consumption Mapping",
    icon: "link",
    route: "/(admin)/inventory/consumption",
  },
];

export default function InventoryHub() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.grid}>
        {SECTIONS.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={[styles.card, item.danger && styles.dangerCard]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={item.icon as any}
                size={32}
                color={item.danger ? "#D32F2F" : "#E53935"}
              />
            </View>
            <Text style={styles.cardText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
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
    paddingBottom: 32,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dangerCard: {
    borderWidth: 2,
    borderColor: "#D32F2F",
  },
  iconContainer: {
    marginBottom: 12,
  },
  cardText: {
    marginTop: 4,
    fontWeight: "600",
    textAlign: "center",
    color: "#212121",
    fontSize: 13,
  },
});
