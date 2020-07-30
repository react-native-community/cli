// @ts-ignore untyped
import {logger} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import {downloadProfile} from './downloadProfile';

type Options = {
  verbose: boolean;
  fileName?: string;
  raw?: boolean;
  sourceMapPath?: string;
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
    if (!options.fileName) {
      logger.info('No filename is provided, pulling latest file');
    }
    if (options.verbose) {
      logger.setVerbose(true);
    }
    await downloadProfile(
      ctx,
      dstPath,
      options.fileName,
      options.sourceMapPath,
      options.raw,
    );
    // if (options.raw) {
    //   await downloadProfile(
    //     ctx,
    //     dstPath,
    //     options.fileName,
    //     options.sourceMapPath,
    //     true,
    //   );
    // } else {
    //   await downloadProfile(
    //     ctx,
    //     dstPath,
    //     options.fileName,
    //     options.sourceMapPath,
    //     false,
    //   );
    // }
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
    {
      name: '--fileName [string]',
      description:
        'Filename of the profile to be downloaded, eg. sampling-profiler-trace8593107139682635366.cpuprofile',
    },
    {
      name: '--verbose',
      description: 'Listing adb commands that are run internally',
    },
    {
      name: '--raw',
      description: 'Pulling original Hermes formatted profile',
    },
    {
      name: '--sourceMapPath [string]',
      description: 'The local path to your source map file',
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
