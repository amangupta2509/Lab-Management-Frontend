import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalEquipment: number;
  availableEquipment: number;
  pendingBookings: number;
  todayBookings: number;
  activeSessions: number;
  totalUsageHours: number;
}

export default function AdminDashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back, Admin</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#2196F3" />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="people" size={32} color="#2196F3" />
            <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statSubtext}>
              {stats?.activeUsers || 0} active
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}>
            <Ionicons name="flask" size={32} color="#9c27b0" />
            <Text style={styles.statValue}>{stats?.totalEquipment || 0}</Text>
            <Text style={styles.statLabel}>Equipment</Text>
            <Text style={styles.statSubtext}>
              {stats?.availableEquipment || 0} available
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
            <Ionicons name="calendar" size={32} color="#ff9800" />
            <Text style={styles.statValue}>{stats?.pendingBookings || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statSubtext}>
              {stats?.todayBookings || 0} today
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="time" size={32} color="#4caf50" />
            <Text style={styles.statValue}>{stats?.activeSessions || 0}</Text>
            <Text style={styles.statLabel}>Active Now</Text>
            <Text style={styles.statSubtext}>
              {stats?.totalUsageHours || 0}h total
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="flask-outline" size={24} color="#2196F3" />
            </View>
            <Text style={styles.actionText}>Add Equipment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#ff9800" />
            </View>
            <Text style={styles.actionText}>Review Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#f3e5f5' }]}>
              <Ionicons name="people-outline" size={24} color="#9c27b0" />
            </View>
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="bar-chart-outline" size={24} color="#4caf50" />
            </View>
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No recent activity</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#212121',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});