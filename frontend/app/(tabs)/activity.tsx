import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { workoutAPI } from '../../src/services/api';
import { WeeklyStats } from '../../src/types';

export default function ActivityScreen() {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadWeeklyStats = async () => {
    try {
      const stats = await workoutAPI.getWeekly();
      setWeeklyStats(stats);
    } catch (error) {
      console.error('Failed to load weekly stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeeklyStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWeeklyStats();
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
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
        <Text style={styles.title}>Weekly Activity</Text>
      </View>

      {weeklyStats && (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Ionicons name="flame" size={32} color="#EF4444" />
              <Text style={styles.summaryValue}>{weeklyStats.total_calories.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>Total Calories</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="fitness" size={32} color="#3B82F6" />
              <Text style={styles.summaryValue}>{weeklyStats.total_exercises}</Text>
              <Text style={styles.summaryLabel}>Total Exercises</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Daily Breakdown</Text>

          {weeklyStats.days.map((day, index) => (
            <View key={day.date} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View>
                  <Text style={styles.dayName}>{getDayName(day.date)}</Text>
                  <Text style={styles.dayDate}>{day.date}</Text>
                </View>
                <View style={styles.dayCalories}>
                  <Ionicons name="flame" size={20} color="#EF4444" />
                  <Text style={styles.dayCaloriesText}>{day.total_calories.toFixed(0)} cal</Text>
                </View>
              </View>

              {day.total_calories > 0 && (
                <View style={styles.dayExercises}>
                  <View style={styles.exerciseRow}>
                    <Ionicons name="hand-left" size={16} color="#3B82F6" />
                    <Text style={styles.exerciseText}>Pushups: {day.pushups}</Text>
                  </View>
                  <View style={styles.exerciseRow}>
                    <Ionicons name="body" size={16} color="#10B981" />
                    <Text style={styles.exerciseText}>Squats: {day.squats}</Text>
                  </View>
                  <View style={styles.exerciseRow}>
                    <Ionicons name="sync" size={16} color="#F59E0B" />
                    <Text style={styles.exerciseText}>Arm Circles: {day.arm_circles}</Text>
                  </View>
                </View>
              )}

              {day.total_calories === 0 && (
                <Text style={styles.restDayText}>Rest Day</Text>
              )}
            </View>
          ))}
        </>
      )}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  summaryCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#374151',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  dayDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dayCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayCaloriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  dayExercises: {
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  restDayText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
