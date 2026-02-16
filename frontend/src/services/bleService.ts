import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { Buffer } from 'buffer';
import * as Location from 'expo-location';

const SERVICE_UUID = 'e267751a-ae76-11eb-8529-0242ac130003';
const EXERCISE_CHARACTERISTIC_UUID = '00002a19-0000-1000-8000-00805f9b34fb';
const START_CHARACTERISTIC_UUID = '19b10012-e8f2-537e-4f6c-d104768a1214';
const PAUSE_CHARACTERISTIC_UUID = '6995b940-b6f4-11eb-8529-0242ac130003';

class BLEService {
  manager: BleManager | null = null;
  device: Device | null = null;

  constructor() {
    // Initialize BLE manager lazily to avoid issues on web
    if (Platform.OS !== 'web') {
      try {
        this.manager = new BleManager();
      } catch (error) {
        console.warn('BLE Manager initialization failed:', error);
      }
    }
  }

  private getManager(): BleManager {
    if (!this.manager) {
      throw new Error('BLE is not available on this platform');
    }
    return this.manager;
  }

  async requestPermissions(): Promise<boolean> {
    console.log('Requesting Bluetooth permissions...');
    
    if (Platform.OS === 'android') {
      try {
        // Step 1: Request Location Permission (required for BLE scanning on Android)
        console.log('Requesting location permission...');
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        
        if (locationStatus.status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'Bluetooth scanning requires location permission on Android. Please grant it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
        console.log('Location permission granted');

        // Step 2: Request Bluetooth Permissions for Android 12+
        if (Platform.Version >= 31) {
          console.log('Requesting Bluetooth permissions for Android 12+...');
          
          const permissions = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ];

          const granted = await PermissionsAndroid.requestMultiple(permissions);
          
          const scanGranted = granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;
          const connectGranted = granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;
          
          console.log('BLUETOOTH_SCAN:', scanGranted);
          console.log('BLUETOOTH_CONNECT:', connectGranted);

          if (!scanGranted || !connectGranted) {
            Alert.alert(
              'Bluetooth Permission Required',
              'Please grant Nearby devices permission in Settings to scan for fitness devices.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() }
              ]
            );
            return false;
          }
          
          console.log('All Bluetooth permissions granted');
          return true;
        } else {
          // Android < 12 only needs location
          console.log('Android < 12: Only location permission needed');
          return true;
        }
      } catch (error) {
        console.error('Permission request error:', error);
        Alert.alert('Permission Error', 'Failed to request permissions: ' + error);
        return false;
      }
    } else if (Platform.OS === 'ios') {
      // iOS handles Bluetooth permissions automatically when scanning
      console.log('iOS: Permissions will be requested automatically');
      return true;
    }
    
    return true;
  }

  async scanForDevices(onDeviceFound: (device: Device) => void): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    this.getManager().startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        return;
      }

      if (device && device.name === 'Get-Fit') {
        onDeviceFound(device);
      }
    });
  }

  stopScan(): void {
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    try {
      const device = await this.getManager().connectToDevice(deviceId);
      this.device = device;
      await device.discoverAllServicesAndCharacteristics();
      return device;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
    }
  }

  async startWorkout(): Promise<void> {
    if (!this.device) throw new Error('No device connected');

    try {
      // Write 1 to start characteristic
      const data = Buffer.from([1]).toString('base64');
      await this.device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        START_CHARACTERISTIC_UUID,
        data
      );
    } catch (error) {
      console.error('Failed to start workout:', error);
      throw error;
    }
  }

  async pauseWorkout(): Promise<void> {
    if (!this.device) throw new Error('No device connected');

    try {
      // Write 1 to pause characteristic
      const data = Buffer.from([1]).toString('base64');
      await this.device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        PAUSE_CHARACTERISTIC_UUID,
        data
      );
    } catch (error) {
      console.error('Failed to pause workout:', error);
      throw error;
    }
  }

  async subscribeToExercises(callback: (exerciseType: number) => void): Promise<void> {
    if (!this.device) throw new Error('No device connected');

    try {
      this.device.monitorCharacteristicForService(
        SERVICE_UUID,
        EXERCISE_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Monitor error:', error);
            return;
          }

          if (characteristic?.value) {
            const buffer = Buffer.from(characteristic.value, 'base64');
            const exerciseType = buffer.readUInt8(0);
            callback(exerciseType);
          }
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to exercises:', error);
      throw error;
    }
  }
}

export const bleService = new BLEService();
