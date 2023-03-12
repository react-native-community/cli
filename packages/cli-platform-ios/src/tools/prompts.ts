import chalk from 'chalk';
import prompts from 'prompts';
import {Device} from '../types';

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
        title: `${chalk.bold(d.name)} ${
          !d.isAvailable && !!d.availabilityError
            ? chalk.red(`(unavailable - ${d.availabilityError})`)
            : ''
        }`,
        value: d,
        disabled: !d.isAvailable,
      })),
    min: 1,
  });
  return device;
}
