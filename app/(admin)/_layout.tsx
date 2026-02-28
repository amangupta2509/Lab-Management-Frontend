import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminTabs() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#E53935",
          tabBarInactiveTintColor: "#9e9e9e",

          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#e0e0e0",
            height: 52 + insets.bottom,
            paddingBottom: insets.bottom || 4,
            paddingTop: 6,
          },

          headerStyle: {
            backgroundColor: "#E53935",
          },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600", fontSize: 17 },
          headerTitleAlign: "left",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="equipment"
          options={{
            title: "Equipment",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flask" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="bookings"
          options={{
            title: "Bookings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="analytics"
          options={{
            title: "Activity",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="users"
          options={{
            title: "Users",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="logbook"
          options={{
            title: "Logbook",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />

        {/* Hide the inventory_layout from tabs */}
        <Tabs.Screen
          name="inventory"
          options={{
            href: null, // This hides it from the tab bar
          }}
        />
      </Tabs>
    </>
  );
}
