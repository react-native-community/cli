/**
 * @flow
 */

import type {ConfigT} from 'types';
import optimizeCommandLineArgs from './optimizeCommandLineArgs';
import {logger} from '@react-native-community/cli-tools';

async function optimize(args: Array<string>, ctx: ConfigT) {
  logger.log('optimize command');
}

export default {
  name: 'optimize',
  description: 'Optimize images',
  func: optimize,
  options: optimizeCommandLineArgs,
};
