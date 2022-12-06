/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import execa from 'execa';
import fs from 'fs';
import {Config} from '@react-native-community/cli-types';
import adb from './adb';
import runOnAllDevices from './runOnAllDevices';
import tryRunAdbReverse from './tryRunAdbReverse';
import tryLaunchAppOnDevice from './tryLaunchAppOnDevice';
import getAdbPath from './getAdbPath';
import {logger, CLIError} from '@react-native-community/cli-tools';
import {getAndroidProject} from '../../config/getAndroidProject';
import {build, runPackager, BuildFlags, options} from '../buildAndroid';

export interface Flags extends BuildFlags {
  appId: string;
  appIdSuffix: string;
  mainActivity: string;
  deviceId?: string;
}

type AndroidProject = NonNullable<Config['project']['android']>;

/**
 * Starts the app on a connected Android emulator or device.
 */
async function runAndroid(_argv: Array<string>, config: Config, args: Flags) {
  const androidProject = getAndroidProject(config);

  await runPackager(args, config);
  return buildAndRun(args, androidProject);
}

// Builds the app and runs it on a connected emulator / device.
function buildAndRun(args: Flags, androidProject: AndroidProject) {
  process.chdir(androidProject.sourceDir);
  const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';

  const adbPath = getAdbPath();
  if (args.deviceId) {
    return runOnSpecificDevice(args, adbPath, androidProject);
  } else {
    return runOnAllDevices(args, cmd, adbPath, androidProject);
  }
}

function runOnSpecificDevice(
  args: Flags,
  adbPath: string,
  androidProject: AndroidProject,
) {
  const devices = adb.getDevices(adbPath);
  const {deviceId} = args;
  if (devices.length > 0 && deviceId) {
    if (devices.indexOf(deviceId) !== -1) {
      // using '-x lint' in order to ignore linting errors while building the apk
      let gradleArgs = ['build', '-x', 'lint'];
      if (args.extraParams) {
        gradleArgs = [...gradleArgs, ...args.extraParams];
      }
      build(gradleArgs, androidProject.sourceDir);
      installAndLaunchOnDevice(args, deviceId, adbPath, androidProject);
    } else {
      logger.error(
        `Could not find device with the id: "${deviceId}". Please choose one of the following:`,
        ...devices,
      );
    }
  } else {
    logger.error('No Android device or emulator connected.');
  }
}

function tryInstallAppOnDevice(
  args: Flags,
  adbPath: string,
  device: string,
  androidProject: AndroidProject,
) {
  try {
    // "app" is usually the default value for Android apps with only 1 app
    const {appName, sourceDir} = androidProject;
    const variant = (args.mode || 'debug').toLowerCase();
    const buildDirectory = `${sourceDir}/${appName}/build/outputs/apk/${variant}`;
    const apkFile = getInstallApkName(
      appName,
      adbPath,
      variant,
      device,
      buildDirectory,
    );

    const pathToApk = `${buildDirectory}/${apkFile}`;
    const adbArgs = ['-s', device, 'install', '-r', '-d', pathToApk];
    logger.info(`Installing the app on the device "${device}"...`);
    logger.debug(
      `Running command "cd android && adb -s ${device} install -r -d ${pathToApk}"`,
    );
    execa.sync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (error) {
    throw new CLIError('Failed to install the app on the device.', error);
  }
}

function getInstallApkName(
  appName: string,
  adbPath: string,
  variant: string,
  device: string,
  buildDirectory: string,
) {
  const availableCPUs = adb.getAvailableCPUs(adbPath, device);

  // check if there is an apk file like app-armeabi-v7a-debug.apk
  for (const availableCPU of availableCPUs.concat('universal')) {
    const apkName = `${appName}-${availableCPU}-${variant}.apk`;
    if (fs.existsSync(`${buildDirectory}/${apkName}`)) {
      return apkName;
    }
  }

  // check if there is a default file like app-debug.apk
  const apkName = `${appName}-${variant}.apk`;
  if (fs.existsSync(`${buildDirectory}/${apkName}`)) {
    return apkName;
  }

  throw new CLIError('Could not find the correct install APK file.');
}

function installAndLaunchOnDevice(
  args: Flags,
  selectedDevice: string,
  adbPath: string,
  androidProject: AndroidProject,
) {
  tryRunAdbReverse(args.port, selectedDevice);
  tryInstallAppOnDevice(args, adbPath, selectedDevice, androidProject);
  tryLaunchAppOnDevice(
    selectedDevice,
    androidProject.packageName,
    adbPath,
    args,
  );
}

export default {
  name: 'run-android',
  description:
    'builds your app and starts it on a connected Android emulator or device',
  func: runAndroid,
  options: [
    ...options,
    {
      name: '--appId <string>',
      description:
        'Specify an applicationId to launch after build. If not specified, `package` from AndroidManifest.xml will be used.',
      default: '',
    },
    {
      name: '--appIdSuffix <string>',
      description: 'Specify an applicationIdSuffix to launch after build.',
      default: '',
    },
    {
      name: '--main-activity <string>',
      description: 'Name of the activity to start',
      default: 'MainActivity',
    },
    {
      name: '--deviceId <string>',
      description:
        'builds your app and starts it on a specific device/simulator with the ' +
        'given device id (listed by running "adb devices" on the command line).',
    },
  ],
};
