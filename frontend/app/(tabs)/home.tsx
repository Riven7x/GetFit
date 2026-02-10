import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { workoutAPI } from '../../src/services/api';
import { DailyStats } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTodayStats = async () => {
    try {
      const stats = await workoutAPI.getToday();
      setTodayStats(stats);
    } catch (error) {
      console.error('Failed to load today stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTodayStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTodayStats();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.bluetoothButton} onPress={() => router.push('/(tabs)/workout')}>
          <Ionicons name="bluetooth" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.mainCardTitle}>Start Your Workout</Text>
        <Text style={styles.mainCardSubtitle}>Connect to your device and track exercises</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/(tabs)/workout')}
        >
          <Ionicons name="play-circle" size={24} color="#FFF" />
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Today's Activity</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.calorieCard]}>
          <Ionicons name="flame" size={32} color="#EF4444" />
          <Text style={styles.statValue}>{todayStats?.total_calories.toFixed(0) || '0'}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>

        <View style={[styles.statCard, styles.pushupCard]}>
          <Ionicons name="hand-left" size={32} color="#3B82F6" />
          <Text style={styles.statValue}>{todayStats?.pushups || '0'}</Text>
          <Text style={styles.statLabel}>Pushups</Text>
        </View>

        <View style={[styles.statCard, styles.squatsCard]}>
          <Ionicons name="body" size={32} color="#10B981" />
          <Text style={styles.statValue}>{todayStats?.squats || '0'}</Text>
          <Text style={styles.statLabel}>Squats</Text>
        </View>

        <View style={[styles.statCard, styles.armCirclesCard]}>
          <Ionicons name="sync" size={32} color="#F59E0B" />
          <Text style={styles.statValue}>{todayStats?.arm_circles || '0'}</Text>
          <Text style={styles.statLabel}>Arm Circles</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.weeklyButton}
        onPress={() => router.push('/(tabs)/activity')}
      >
        <Text style={styles.weeklyButtonText}>View Weekly Stats</Text>
        <Ionicons name="arrow-forward" size={20} color="#3B82F6" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  bluetoothButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  mainCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  mainCardSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  calorieCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  pushupCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  squatsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  armCirclesCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  weeklyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  weeklyButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});
