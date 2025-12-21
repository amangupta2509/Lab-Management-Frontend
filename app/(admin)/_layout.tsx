import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (user?.role !== 'admin') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: 'Equipment',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flask" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}