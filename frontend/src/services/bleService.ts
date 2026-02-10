import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import * as ExpoDevice from 'expo-device';
import { Buffer } from 'buffer';

const SERVICE_UUID = 'e267751a-ae76-11eb-8529-0242ac130003';
const EXERCISE_CHARACTERISTIC_UUID = '00002a19-0000-1000-8000-00805f9b34fb';
const START_CHARACTERISTIC_UUID = '19b10012-e8f2-537e-4f6c-d104768a1214';
const PAUSE_CHARACTERISTIC_UUID = '6995b940-b6f4-11eb-8529-0242ac130003';

class BLEService {
  manager: BleManager;
  device: Device | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth requires Location permission',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }
    return true;
  }

  async scanForDevices(onDeviceFound: (device: Device) => void): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    this.manager.startDeviceScan(null, null, (error, device) => {
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
    this.manager.stopDeviceScan();
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
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
