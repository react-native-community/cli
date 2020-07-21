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
    //logger.log(`options ${JSON.stringify(options)}`);
    // logger.log(`${typeof options}`);
    // logger.log(`${options.fileName}`);
    if (options.fileName) {
      //logger.log(options.fileName);
      await downloadProfile(ctx, dstPath, options.fileName);
    } else {
      logger.info('No filename is provided, pulling latest file');
      await downloadProfile(ctx, dstPath, undefined);
    }
    //logger.log(output);
  } catch (err) {
    logger.error(`Unable to download the Hermes Sampling Profiler.\n${err}`);
  }
}

// type Command = {
//     name: string,
//     description?: string,
//     func: (argv: Array<string>, config: ConfigT, args: Object) => ?Promise<void>,
//     options?: Array<{
//       name: string,
//       description?: string,
//       parse?: (val: string) => any,
//       default?:
//         | string
//         | boolean
//         | number
//         | ((config: ConfigT) => string | boolean | number),
//     }>,
//     examples?: Array<{
//       desc: string,
//       cmd: string,
//     }>,
//   };

export default {
  name: 'profile-hermes [destinationDir]', //profile-hermes ls
  description:
    'Download the Hermes Sampling Profiler to the directory <destinationDir> of the local machine',
  func: profile, //how to give the args for this func: an array of arguments
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
