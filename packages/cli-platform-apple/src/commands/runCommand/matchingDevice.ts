import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {Device} from '../../types';

export function matchingDevice(
  devices: Array<Device>,
  deviceName: string | true | undefined,
) {
  if (deviceName === true) {
    const firstIOSDevice = devices.find((d) => d.type === 'device')!;
    if (firstIOSDevice) {
      logger.info(
        `Using first available device named "${chalk.bold(
          firstIOSDevice.name,
        )}" due to lack of name supplied.`,
      );
      return firstIOSDevice;
    } else {
      logger.error('No iOS devices connected.');
      return undefined;
    }
  }
  const deviceByName = devices.find(
    (device) =>
      device.name === deviceName || formattedDeviceName(device) === deviceName,
  );
  if (!deviceByName) {
    logger.error(
      `Could not find a device named: "${chalk.bold(
        String(deviceName),
      )}". ${printFoundDevices(devices)}`,
    );
  }
  return deviceByName;
}

export function formattedDeviceName(simulator: Device) {
  return simulator.version
    ? `${simulator.name} (${simulator.version})`
    : simulator.name;
}

export function printFoundDevices(devices: Array<Device>) {
  return [
    'Available devices:',
    ...devices.map((device) => `  - ${device.name} (${device.udid})`),
  ].join('\n');
}
