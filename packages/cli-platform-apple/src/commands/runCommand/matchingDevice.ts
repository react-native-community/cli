import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {Device, DeviceType} from '../../types';

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
  return devices.find(
    (device) =>
      device.name === deviceName || formattedDeviceName(device) === deviceName,
  );
}

export function formattedDeviceName(simulator: Device) {
  return simulator.version
    ? `${simulator.name} (${simulator.version})`
    : simulator.name;
}

export function printFoundDevices(devices: Array<Device>, type?: DeviceType) {
  let filteredDevice = [...devices];

  if (type) {
    filteredDevice = filteredDevice.filter((device) => device.type === type);
  }

  return [
    'Available devices:',
    ...filteredDevice.map(({name, udid}) => `  - ${name} (${udid})`),
  ].join('\n');
}
