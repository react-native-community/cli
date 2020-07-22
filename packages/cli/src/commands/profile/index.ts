// @ts-ignore untyped
import {logger} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import {downloadProfile} from './downloadProfile';

type Options = {
  fileName?: string;
};

async function profile(
  [dstPath]: Array<string>,
  ctx: Config,
  options: Options,
) {
  try {
    logger.info(
      'Downloading a Hermes Sampling Profiler from your Android device...',
    );

    if (options.fileName) {
      await downloadProfile(ctx, dstPath, options.fileName);
    } else {
      logger.info('No filename is provided, pulling latest file');
      await downloadProfile(ctx, dstPath, undefined);
    }
  } catch (err) {
    logger.error(`Unable to download the Hermes Sampling Profiler.\n${err}`);
  }
}

export default {
  name: 'profile-hermes [destinationDir]',
  description:
    'Download the Hermes Sampling Profiler to the directory <destinationDir> of the local machine',
  func: profile,
  options: [
    //options: download the latest or fileName
    {
      name: '--fileName [string]',
      description: 'Filename of the profile to be downloaded',
    },
  ],
  examples: [
    {
      desc:
        'Download the Hermes Sampling Profiler to the directory <destinationDir> of the local machine',
      cmd: 'profile-hermes /Users/phuonganh/Desktop',
    },
  ],
};
