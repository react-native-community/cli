import {Device} from '../../types';
import parseIOSDevicesList from './parseIOSDevicesList';
import parseXctraceIOSDevicesList from './parseXctraceIOSDevicesList';
import execa from 'execa';
import {logger} from '@react-native-community/cli-tools';
import prompts from 'prompts';
import chalk from 'chalk';

export async function promptForDeviceSelection(
  availableDevices: Device[],
): Promise<Device | undefined> {
  const {device} = await prompts({
    type: 'select',
    name: 'device',
    message: 'Select the device you want to use',
    choices: availableDevices
      .filter((d) => d.type === 'device' || d.type === 'simulator')
      .map((d) => ({
        title: `${chalk.bold(d.name)}`,
        value: d,
      })),
    min: 1,
  });
  return device;
}

async function listIOSDevices(): Promise<Device[]> {
  let devices;
  try {
    const out = execa.sync('xcrun', ['xctrace', 'list', 'devices']);
    devices = parseXctraceIOSDevicesList(
      // Xcode 12.5 introduced a change to output the list to stdout instead of stderr
      out.stderr === '' ? out.stdout : out.stderr,
    );
  } catch (e) {
    logger.warn(
      'Support for Xcode 11 and older is deprecated. Please upgrade to Xcode 12.',
    );
    devices = parseIOSDevicesList(
      execa.sync('xcrun', ['instruments', '-s']).stdout,
    );
  }
  return devices;
}

export default listIOSDevices;
