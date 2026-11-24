import {execFileSync} from 'child_process';
import adb from './adb';
import getAdbPath from './getAdbPath';
import {getEmulators} from './tryLaunchEmulator';
import {toPascalCase} from './toPascalCase';
import pico from 'picocolors';
import {CLIError, prompt} from '@react-native-community/cli-tools';

type DeviceData = {
  deviceId: string | undefined;
  readableName: string;
  connected: boolean;
  type: 'emulator' | 'phone';
};

/**
 *
 * @param deviceId string
 * @returns name of Android emulator
 */
function getEmulatorName(deviceId: string) {
  const adbPath = getAdbPath();
  const buffer = execFileSync(adbPath, ['-s', deviceId, 'emu', 'avd', 'name']);

  // 1st line should get us emu name
  return buffer.toString().split(/\r?\n/)[0].trim();
}

/**
 *
 * @param deviceId string
 * @returns Android device name in readable format
 */
function getPhoneName(deviceId: string) {
  const adbPath = getAdbPath();
  const buffer = execFileSync(adbPath, [
    '-s',
    deviceId,
    'shell',
    'getprop',
    'ro.product.model',
  ]);
  return buffer.toString().trim();
}

async function promptForDeviceSelection(
  allDevices: Array<DeviceData>,
): Promise<DeviceData | undefined> {
  if (!allDevices.length) {
    throw new CLIError(
      'No devices and/or emulators connected. Please create emulator with Android Studio or connect Android device.',
    );
  }
  const {device} = await prompt({
    type: 'select',
    name: 'device',
    message: 'Select the device / emulator you want to use',
    choices: allDevices.map((d) => ({
      title: `${pico.bold(`${toPascalCase(d.type)}`)} ${pico.green(
        `${d.readableName}`,
      )} (${d.connected ? 'connected' : 'disconnected'})`,
      value: d,
    })),
    min: 1,
  });

  return device;
}

async function listAndroidDevices() {
  const adbPath = getAdbPath();
  const devices = adb.getDevices(adbPath);

  const allDevices: Array<DeviceData> = [];

  devices.forEach((deviceId) => {
    if (deviceId.includes('emulator')) {
      const emulatorData: DeviceData = {
        deviceId,
        readableName: getEmulatorName(deviceId),
        connected: true,
        type: 'emulator',
      };
      allDevices.push(emulatorData);
    } else {
      const phoneData: DeviceData = {
        deviceId,
        readableName: getPhoneName(deviceId),
        type: 'phone',
        connected: true,
      };
      allDevices.push(phoneData);
    }
  });

  const emulators = getEmulators();
  const emulatorNames = new Set(
    allDevices
      .filter((device) => device.type === 'emulator')
      .map((device) => device.readableName),
  );

  // Find not booted ones:
  emulators.forEach((emulatorName) => {
    // skip those already booted
    if (emulatorNames.has(emulatorName)) {
      return;
    }
    const emulatorData: DeviceData = {
      deviceId: undefined,
      readableName: emulatorName,
      type: 'emulator',
      connected: false,
    };
    allDevices.push(emulatorData);
    emulatorNames.add(emulatorName);
  });

  const selectedDevice = await promptForDeviceSelection(allDevices);
  return selectedDevice;
}

export default listAndroidDevices;
