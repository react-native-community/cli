/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import path from 'path';
import {spawnSync, spawn, execFileSync} from 'child_process';
import fs from 'fs';

import type {ConfigT} from 'types';

import adb from './adb';
import runOnAllDevices from './runOnAllDevices';
import tryRunAdbReverse from './tryRunAdbReverse';
import tryLaunchAppOnDevice from './tryLaunchAppOnDevice';
import getAdbPath from './getAdbPath';
import {
  isPackagerRunning,
  logger,
  getDefaultUserTerminal,
  CLIError,
} from '@react-native-community/cli-tools';

// Verifies this is an Android project
function checkAndroid(root) {
  return fs.existsSync(path.join(root, 'android/gradlew'));
}

export type FlagsT = {|
  tasks?: Array<string>,
  root: string,
  variant: string,
  appFolder: string,
  appId: string,
  appIdSuffix: string,
  mainActivity: string,
  deviceId?: string,
  packager: boolean,
  port: number,
  terminal: string,
|};

/**
 * Starts the app on a connected Android emulator or device.
 */
function runAndroid(argv: Array<string>, config: ConfigT, args: FlagsT) {
  if (!checkAndroid(args.root)) {
    logger.error(
      'Android project not found. Are you sure this is a React Native project?',
    );
    return;
  }

  if (!args.packager) {
    return buildAndRun(args);
  }

  return isPackagerRunning(args.port).then(result => {
    if (result === 'running') {
      logger.info('JS server already running.');
    } else if (result === 'unrecognized') {
      logger.warn('JS server not recognized, continuing with build...');
    } else {
      // result == 'not_running'
      logger.info('Starting JS server...');
      startServerInNewWindow(args.port, args.terminal, config.reactNativePath);
    }
    return buildAndRun(args);
  });
}

function getPackageNameWithSuffix(appId, appIdSuffix, packageName) {
  if (appId) {
    return appId;
  }
  if (appIdSuffix) {
    return `${packageName}.${appIdSuffix}`;
  }

  return packageName;
}

// Builds the app and runs it on a connected emulator / device.
function buildAndRun(args) {
  process.chdir(path.join(args.root, 'android'));
  const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';

  // "app" is usually the default value for Android apps with only 1 app
  const {appFolder} = args;
  const packageName = fs
    .readFileSync(`${appFolder}/src/main/AndroidManifest.xml`, 'utf8')
    // $FlowFixMe
    .match(/package="(.+?)"/)[1];

  const packageNameWithSuffix = getPackageNameWithSuffix(
    args.appId,
    args.appIdSuffix,
    packageName,
  );

  const adbPath = getAdbPath();
  if (args.deviceId) {
    return runOnSpecificDevice(
      args,
      cmd,
      packageNameWithSuffix,
      packageName,
      adbPath,
    );
  } else {
    return runOnAllDevices(
      args,
      cmd,
      packageNameWithSuffix,
      packageName,
      adbPath,
    );
  }
}

function runOnSpecificDevice(
  args,
  gradlew,
  packageNameWithSuffix,
  packageName,
  adbPath,
) {
  const devices = adb.getDevices(adbPath);
  const {deviceId} = args;
  if (devices.length > 0 && deviceId) {
    if (devices.indexOf(deviceId) !== -1) {
      buildApk(gradlew);
      installAndLaunchOnDevice(
        args,
        deviceId,
        packageNameWithSuffix,
        packageName,
        adbPath,
      );
    } else {
      logger.error(
        `Could not find device with the id: "${deviceId}". Please choose one of the following:`,
        ...devices,
      );
    }
  } else {
    logger.error('No Android devices connected.');
  }
}

function buildApk(gradlew) {
  try {
    // using '-x lint' in order to ignore linting errors while building the apk
    const gradleArgs = ['build', '-x', 'lint'];
    logger.info('Building the app...');
    logger.debug(`Running command "${gradlew} ${gradleArgs.join(' ')}"`);
    execFileSync(gradlew, gradleArgs, {stdio: 'inherit'});
  } catch (error) {
    throw new CLIError('Failed to build the app.', error);
  }
}

function tryInstallAppOnDevice(args, adbPath, device) {
  try {
    // "app" is usually the default value for Android apps with only 1 app
    const {appFolder} = args;
    const variant = args.variant.toLowerCase();
    const buildDirectory = `${appFolder}/build/outputs/apk/${variant}`;
    const apkFile = getInstallApkName(
      appFolder,
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
    execFileSync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (error) {
    throw new CLIError('Failed to install the app on the device.', error);
  }
}

function getInstallApkName(
  appFolder,
  adbPath,
  variant,
  device,
  buildDirectory,
) {
  const availableCPUs = adb.getAvailableCPUs(adbPath, device);

  // check if there is an apk file like app-armeabi-v7a-debug.apk
  for (const availableCPU of availableCPUs.concat('universal')) {
    const apkName = `${appFolder}-${availableCPU}-${variant}.apk`;
    if (fs.existsSync(`${buildDirectory}/${apkName}`)) {
      return apkName;
    }
  }

  // check if there is a default file like app-debug.apk
  const apkName = `${appFolder}-${variant}.apk`;
  if (fs.existsSync(`${buildDirectory}/${apkName}`)) {
    return apkName;
  }

  throw new Error('Not found the correct install APK file!');
}

function installAndLaunchOnDevice(
  args,
  selectedDevice,
  packageNameWithSuffix,
  packageName,
  adbPath,
) {
  tryRunAdbReverse(args.port, selectedDevice);
  tryInstallAppOnDevice(args, adbPath, selectedDevice);
  tryLaunchAppOnDevice(
    selectedDevice,
    packageNameWithSuffix,
    packageName,
    adbPath,
    args.mainActivity,
  );
}

function startServerInNewWindow(port, terminal, reactNativePath) {
  /**
   * Set up OS-specific filenames and commands
   */
  const isWindows = /^win/.test(process.platform);
  const scriptFile = isWindows
    ? 'launchPackager.bat'
    : 'launchPackager.command';
  const packagerEnvFilename = isWindows ? '.packager.bat' : '.packager.env';
  const portExportContent = isWindows
    ? `set RCT_METRO_PORT=${port}`
    : `export RCT_METRO_PORT=${port}`;

  /**
   * Set up the `.packager.(env|bat)` file to ensure the packager starts on the right port.
   */
  const launchPackagerScript = path.join(
    reactNativePath,
    `scripts/${scriptFile}`,
  );

  /**
   * Set up the `launchpackager.(command|bat)` file.
   * It lives next to `.packager.(bat|env)`
   */
  const scriptsDir = path.dirname(launchPackagerScript);
  const packagerEnvFile = path.join(scriptsDir, packagerEnvFilename);
  const procConfig: Object = {cwd: scriptsDir};

  /**
   * Ensure we overwrite file by passing the `w` flag
   */
  fs.writeFileSync(packagerEnvFile, portExportContent, {
    encoding: 'utf8',
    flag: 'w',
  });

  if (process.platform === 'darwin') {
    if (terminal) {
      return spawnSync(
        'open',
        ['-a', terminal, launchPackagerScript],
        procConfig,
      );
    }
    return spawnSync('open', [launchPackagerScript], procConfig);
  }
  if (process.platform === 'linux') {
    if (terminal) {
      procConfig.detached = true;
      return spawn(terminal, ['-e', `sh ${launchPackagerScript}`], procConfig);
    }
    // By default, the child shell process will be attached to the parent
    procConfig.detached = false;
    return spawn('sh', [launchPackagerScript], procConfig);
  }
  if (/^win/.test(process.platform)) {
    procConfig.detached = true;
    procConfig.stdio = 'ignore';
    return spawn('cmd.exe', ['/C', launchPackagerScript], procConfig);
  }
  logger.error(
    `Cannot start the packager. Unknown platform ${process.platform}`,
  );
}

export default {
  name: 'run-android',
  description:
    'builds your app and starts it on a connected Android emulator or device',
  func: runAndroid,
  options: [
    {
      name: '--root [string]',
      description:
        'Override the root directory for the android build (which contains the android directory)',
      default: '',
    },
    {
      name: '--variant [string]',
      description: "Specify your app's build variant",
      default: 'debug',
    },
    {
      name: '--appFolder [string]',
      description:
        'Specify a different application folder name for the android source. If not, we assume is "app"',
      default: 'app',
    },
    {
      name: '--appId [string]',
      description: 'Specify an applicationId to launch after build.',
      default: '',
    },
    {
      name: '--appIdSuffix [string]',
      description: 'Specify an applicationIdSuffix to launch after build.',
      default: '',
    },
    {
      name: '--main-activity [string]',
      description: 'Name of the activity to start',
      default: 'MainActivity',
    },
    {
      name: '--deviceId [string]',
      description:
        'builds your app and starts it on a specific device/simulator with the ' +
        'given device id (listed by running "adb devices" on the command line).',
    },
    {
      name: '--no-packager',
      description: 'Do not launch packager while building',
    },
    {
      name: '--port [number]',
      default: process.env.RCT_METRO_PORT || 8081,
      parse: (val: string) => Number(val),
    },
    {
      name: '--terminal [string]',
      description:
        'Launches the Metro Bundler in a new window using the specified terminal path.',
      default: getDefaultUserTerminal,
    },
    {
      name: '--tasks [list]',
      description: 'Run custom Gradle tasks. By default it\'s "installDebug"',
      parse: (val: string) => val.split(','),
    },
  ],
};
