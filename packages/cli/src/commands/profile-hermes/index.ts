// @ts-ignore untyped
import {logger} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import {downloadProfile} from './downloadProfile';

type Options = {
  verbose: boolean;
  fileName?: string;
  raw?: boolean;
  sourcemapPath?: string;
  generateSourcemap?: boolean;
};

async function profileHermes(
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
      options.sourcemapPath,
      options.raw,
      options.generateSourcemap,
    );
  } catch (err) {
    logger.error(`Unable to download the Hermes Sampling Profile.\n${err}`);
  }
}

export default {
  name: 'profile-hermes [destinationDir]',
  description:
    'Pull and convert a Hermes tracing profile to Chrome tracing profile, then store it in the directory <destinationDir> of the local machine',
  func: profileHermes,
  options: [
    {
      name: '--fileName [string]',
      description:
        'File name of the profile to be downloaded, eg. sampling-profiler-trace8593107139682635366.cpuprofile',
    },
    {
      name: '--verbose',
      description:
        'Lists adb commands that are run internally when pulling the file from Android device',
    },
    {
      name: '--raw',
      description:
        'Pull the original Hermes tracing profile without any transformation',
    },
    {
      name: '--sourcemap-path [string]',
      description:
        'The local path to your source map file, eg. /tmp/sourcemap.json',
    },
    {
      name: '--generate-sourcemap',
      description: 'Generate the JS bundle and source map',
    },
  ],
  examples: [
    {
      desc:
        'Download the Hermes Sampling Profiler to the directory <destinationDir> on the local machine',
      cmd: 'profile-hermes /tmp',
    },
  ],
};
