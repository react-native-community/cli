import {CLIError} from '@react-native-community/cli-tools';
import child_process from 'child_process';
import {Device} from '../types';

const getSimulators = () => {
  let simulators: {devices: {[index: string]: Array<Device>}};

  try {
    simulators = JSON.parse(
      child_process.execFileSync(
        'xcrun',
        ['simctl', 'list', '--json', 'devices'],
        {encoding: 'utf8'},
      ),
    );
  } catch (error) {
    throw new CLIError(
      'Could not get the simulator list from Xcode. Please open Xcode and try running project directly from there to resolve the remaining issues.',
    );
  }
  return simulators;
};

export default getSimulators;
