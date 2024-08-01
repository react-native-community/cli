import chalk from 'chalk';
import {Device} from '../types';
import {prompt} from '@react-native-community/cli-tools';

function getVersionFromDevice({version}: Device) {
  return version ? ` (${version.match(/^(\d+\.\d+)/)?.[1]})` : '';
}

export async function promptForSchemeSelection(
  schemes: string[],
): Promise<string> {
  const {scheme} = await prompt({
    name: 'scheme',
    type: 'select',
    message: 'Select the scheme you want to use',
    choices: schemes.map((value) => ({
      title: value,
      value: value,
    })),
  });

  return scheme;
}

export async function promptForConfigurationSelection(
  configurations: string[],
): Promise<string> {
  const {configuration} = await prompt({
    name: 'configuration',
    type: 'select',
    message: 'Select the configuration you want to use',
    choices: configurations.map((value) => ({
      title: value,
      value: value,
    })),
  });

  return configuration;
}

export async function promptForDeviceSelection(
  devices: Device[],
): Promise<Device | undefined> {
  const {device} = await prompt({
    type: 'select',
    name: 'device',
    message: 'Select the device you want to use',
    choices: devices
      .filter(({type}) => type === 'device' || type === 'simulator')
      .map((d) => {
        const availability =
          !d.isAvailable && !!d.availabilityError
            ? chalk.red(`(unavailable - ${d.availabilityError})`)
            : '';

        return {
          title: `${chalk.bold(
            `${d.name}${getVersionFromDevice(d)}`,
          )} ${availability}`,
          value: d,
          disabled: !d.isAvailable,
        };
      }),
    min: 1,
  });
  return device;
}

export async function promptForDeviceToTailLogs(
  platformReadableName: string,
  simulators: Device[],
): Promise<string> {
  const {udid} = await prompt({
    type: 'select',
    name: 'udid',
    message: `Select ${platformReadableName} simulators to tail logs from`,
    choices: simulators.map((simulator) => ({
      title: `${simulator.name}${getVersionFromDevice(simulator)}`.trim(),
      value: simulator.udid,
    })),
  });

  return udid;
}
