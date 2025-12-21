import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={120} color="#2196F3" />
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>Page Not Found</Text>
      <Text style={styles.description}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => router.replace('/(tabs)')}
      >
        <Ionicons name="home" size={20} color="#fff" />
        <Text style={styles.homeButtonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  homeButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});