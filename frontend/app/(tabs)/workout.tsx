import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { bleService } from '../../src/services/bleService';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { useAuthStore } from '../../src/store/authStore';
import { workoutAPI } from '../../src/services/api';
import { calculateCalories, getDuration } from '../../src/utils/calorieCalculator';
import { Exercise } from '../../src/types';

const EXERCISE_MAP: { [key: number]: string } = {
  0: 'arm_circles',
  1: 'squats',
  2: 'pushup',
};

export default function WorkoutScreen() {
  const { user } = useAuthStore();
  const {
    isActive,
    exerciseCounts,
    currentExercise,
    startTime,
    startWorkout,
    stopWorkout,
    addExercise,
    setCurrentExercise,
    resetWorkout,
  } = useWorkoutStore();

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleScan = async () => {
    try {
      setScanning(true);
      
      // Request permissions first
      const hasPermission = await bleService.requestPermissions();
      
      if (!hasPermission) {
        setScanning(false);
        Alert.alert(
          'Permissions Required',
          'Please grant Location and Bluetooth permissions in your phone Settings to scan for devices.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      console.log('Starting BLE scan...');
      await bleService.scanForDevices((device) => {
        console.log('Device found:', device.name, device.id);
        bleService.stopScan();
        setScanning(false);
        setDeviceId(device.id);
        Alert.alert(
          'Device Found',
          'Get-Fit device found. Connect now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Connect', onPress: () => handleConnect(device.id) },
          ]
        );
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        bleService.stopScan();
        setScanning(false);
        if (!deviceId) {
          Alert.alert('No Device Found', 'Make sure your Get-Fit device is powered on and nearby. Check Arduino Serial Monitor shows "Bluetooth device active".');
        }
      }, 10000);
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', error.message || 'Failed to scan for devices');
      setScanning(false);
    }
  };

  const handleConnect = async (id: string) => {
    try {
      setConnecting(true);
      await bleService.connectToDevice(id);
      setConnected(true);
      setDeviceId(id);
      
      // Subscribe to exercise updates
      await bleService.subscribeToExercises((exerciseType) => {
        const exerciseName = EXERCISE_MAP[exerciseType];
        if (exerciseName) {
          addExercise(exerciseName);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      });

      Alert.alert('Connected', 'Successfully connected to Get-Fit device!');
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bleService.disconnect();
      setConnected(false);
      setDeviceId(null);
      if (isActive) {
        handleStopWorkout();
      }
    } catch (error: any) {
      Alert.alert('Disconnect Error', error.message);
    }
  };

  const handleStartWorkout = async () => {
    if (!connected) {
      Alert.alert('Not Connected', 'Please connect to your device first.');
      return;
    }

    try {
      await bleService.startWorkout();
      startWorkout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Start Error', error.message);
    }
  };

  const handleStopWorkout = async () => {
    try {
      await bleService.pauseWorkout();
      stopWorkout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // Save workout
      await saveWorkout();
    } catch (error: any) {
      Alert.alert('Stop Error', error.message);
    }
  };

  const saveWorkout = async () => {
    if (!startTime || !user?.weight_kg) {
      Alert.alert('Cannot Save', 'Missing workout data or user weight.');
      return;
    }

    try {
      setSaving(true);
      const exercises: Exercise[] = [];

      Object.entries(exerciseCounts).forEach(([type, count]) => {
        if (count > 0) {
          const calories = calculateCalories(type, count, user.weight_kg!);
          const duration = getDuration(type, count);
          exercises.push({
            type: type as 'pushup' | 'squats' | 'arm_circles',
            count,
            duration_seconds: duration,
            calories,
          });
        }
      });

      if (exercises.length > 0) {
        await workoutAPI.create(exercises, startTime, new Date());
        Alert.alert('Success', 'Workout saved successfully!');
        resetWorkout();
      }
    } catch (error: any) {
      Alert.alert('Save Error', 'Failed to save workout: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getTotalCalories = () => {
    if (!user?.weight_kg) return 0;
    return Object.entries(exerciseCounts).reduce((total, [type, count]) => {
      return total + calculateCalories(type, count, user.weight_kg!);
    }, 0);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout</Text>
        {connected ? (
          <View style={styles.statusBadge}>
            <View style={styles.connectedDot} />
            <Text style={styles.statusText}>Connected</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.disconnectedBadge]}>
            <Text style={styles.disconnectedText}>Disconnected</Text>
          </View>
        )}
      </View>

      {!connected ? (
        <View style={styles.connectionSection}>
          <Ionicons name="bluetooth" size={64} color="#9CA3AF" />
          <Text style={styles.connectionTitle}>Connect Your Device</Text>
          <Text style={styles.connectionSubtitle}>
            Scan for your Get-Fit Arduino device to start tracking
          </Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScan}
            disabled={scanning || connecting}
          >
            {scanning || connecting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#FFF" />
                <Text style={styles.scanButtonText}>Scan for Device</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {!isActive ? (
            <View style={styles.startSection}>
              <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
                <Ionicons name="play-circle" size={48} color="#FFF" />
                <Text style={styles.startButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activeSection}>
              <View style={styles.calorieDisplay}>
                <Ionicons name="flame" size={32} color="#EF4444" />
                <Text style={styles.calorieValue}>{getTotalCalories().toFixed(1)}</Text>
                <Text style={styles.calorieLabel}>Calories Burned</Text>
              </View>

              {currentExercise && (
                <View style={styles.currentExercise}>
                  <Text style={styles.currentExerciseLabel}>Current Exercise</Text>
                  <Text style={styles.currentExerciseText}>
                    {currentExercise === 'arm_circles' ? 'Arm Circles' : 
                     currentExercise === 'pushup' ? 'Pushup' : 'Squats'}
                  </Text>
                </View>
              )}

              <View style={styles.exerciseList}>
                <View style={styles.exerciseItem}>
                  <Ionicons name="hand-left" size={24} color="#3B82F6" />
                  <Text style={styles.exerciseName}>Pushups</Text>
                  <Text style={styles.exerciseCount}>{exerciseCounts.pushup || 0}</Text>
                </View>

                <View style={styles.exerciseItem}>
                  <Ionicons name="body" size={24} color="#10B981" />
                  <Text style={styles.exerciseName}>Squats</Text>
                  <Text style={styles.exerciseCount}>{exerciseCounts.squats || 0}</Text>
                </View>

                <View style={styles.exerciseItem}>
                  <Ionicons name="sync" size={24} color="#F59E0B" />
                  <Text style={styles.exerciseName}>Arm Circles</Text>
                  <Text style={styles.exerciseCount}>{exerciseCounts.arm_circles || 0}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.stopButton}
                onPress={handleStopWorkout}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="stop-circle" size={24} color="#FFF" />
                    <Text style={styles.stopButtonText}>Stop & Save Workout</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Text style={styles.disconnectButtonText}>Disconnect Device</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  disconnectedBadge: {
    backgroundColor: '#1F2937',
  },
  disconnectedText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  connectionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  connectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 24,
    marginBottom: 8,
  },
  connectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  scanButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startSection: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 40,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  activeSection: {
    marginBottom: 24,
  },
  calorieDisplay: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  calorieLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  currentExercise: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  currentExerciseLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  currentExerciseText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  exerciseList: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    marginLeft: 12,
  },
  exerciseCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  stopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  disconnectButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
});
