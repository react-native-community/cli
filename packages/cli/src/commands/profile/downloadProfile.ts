// @ts-ignore untyped
import getEnvironmentInfo from '../../tools/envinfo';
import {logger} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import releaseChecker from '../../tools/releaseChecker';
import { listFiles } from './listFile';
import { pullFile } from './pullFile';

// const info = async function getInfo(_argv: Array<string>, ctx: Config) {
//   try {
//     logger.info('Fetching system and libraries information...');
//     const output = await getEnvironmentInfo(false);
//     logger.log(output);
//   } catch (err) {
//     logger.error(`Unable to print environment info.\n${err}`);
//   } finally {
//     await releaseChecker(ctx.root);
//   }
// };
type Options = {
    fileName?: string;
  };
const promise = require('adbkit/bluebird');
const adb = require('adbkit/lib/adb');
const client = adb.createClient();
function download(dstPath: string){
  listFiles('com.awesomeproject');
  pullFile(dstPath);
}

const hermesProfile = async function downloadProfile(_argv: Array<string>, ctx: Config, options: Options) {
    try{
        logger.info('Downloading the latest Hermes Sampling Profiler from your Android device...');
        const output = await 

    }
    catch (err){
        logger.error(`Unable to download the Hermes Sampling Profiler.\n${err}`);
    }
    finally{
        await 
    }
};

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
  name: 'profile-hermes <destinationDir>',
  description: 'Download the Hermes Sampling Profiler to the directory <destinationDir> of the local machine',
  func: hermesProfile,
  //options: download the latest or filename 
  options: [
    {
      name: '--filename <string>',
      description: 'Filename of the profile to be downloaded',
    },
   ],
   examples: [
       {
        desc: 'Download the Hermes Sampling Profiler to the directory <destinationDir> of the local machine',
        cmd: 'profile-hermes /users/name/desktop',
       },   
   ],
};


