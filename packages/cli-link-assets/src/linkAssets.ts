import {logger} from '@react-native-community/cli-tools';
import type {Config as CLIConfig} from '@react-native-community/cli-types';

type Args = {};

async function linkAssets(
  _argv: string[],
  _ctx: CLIConfig,
  _cleanOptions: Args,
): Promise<void> {
  logger.info('linkAssets!');
}

export default {
  func: linkAssets,
  name: 'link-assets',
  description: 'TODO',
  options: [],
};
