import {CLIError} from '@react-native-community/cli-tools';
import {getDestinationSimulator} from '../../tools/getDestinationSimulator';
import {Device} from '../../types';
import {FlagsT} from './createRun';

export function getFallbackSimulator(args: FlagsT): Device {
  /**
   * If provided simulator does not exist, try simulators in following order
   * - iPhone 14
   * - iPhone 13
   * - iPhone 12
   * - iPhone 11
   */

  const fallbackSimulators = [
    'iPhone 14',
    'iPhone 13',
    'iPhone 12',
    'iPhone 11',
  ];
  const selectedSimulator = getDestinationSimulator(args, fallbackSimulators);

  if (!selectedSimulator) {
    throw new CLIError(
      `No simulator available with ${
        args.simulator ? `name "${args.simulator}"` : `udid "${args.udid}"`
      }`,
    );
  }

  return selectedSimulator;
}
