/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import execa from 'execa';
import chalk from 'chalk';
import fs from 'fs';
import {Config} from '@react-native-community/cli-types';
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
import warnAboutManuallyLinkedLibs from '../../link/warnAboutManuallyLinkedLibs';

// Verifies this is an Android project
function checkAndroid(root: string) {
  return fs.existsSync(path.join(root, 'android/gradlew'));
}

export interface Flags {
  tasks?: Array<string>;
  root: string;
  variant: string;
  appFolder: string;
  appId: string;
  appIdSuffix: string;
  mainActivity: string;
  deviceId?: string;
  packager: boolean;
  port: number;
  terminal: string;
  jetifier: boolean;
}

/**
 * Starts the app on a connected Android emulator or device.
 */
async function runAndroid(_argv: Array<string>, config: Config, args: Flags) {
  if (!checkAndroid(args.root)) {
    logger.error(
      'Android project not found. Are you sure this is a React Native project?',
    );
    return;
  }

  warnAboutManuallyLinkedLibs(config);

  if (args.jetifier) {
    logger.info(
      `Running ${chalk.bold(
        'jetifier',
      )} to migrate libraries to AndroidX. ${chalk.dim(
        'You can disable it using "--no-jetifier" flag.',
      )}`,
    );

    try {
      await execa(require.resolve('jetifier/bin/jetify'), {stdio: 'inherit'});
    } catch (error) {
      throw new CLIError('Failed to run jetifier.', error);
    }
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
      try {
        startServerInNewWindow(
          args.port,
          args.terminal,
          config.reactNativePath,
        );
      } catch (error) {
        logger.warn(
          `Failed to automatically start the packager server. Please run "react-native start" manually. Error details: ${
            error.message
          }`,
        );
      }
    }
    return buildAndRun(args);
  });
}

function getPackageNameWithSuffix(
  appId: string,
  appIdSuffix: string,
  packageName: string,
) {
  if (appId) {
    return appId;
  }
  if (appIdSuffix) {
    return `${packageName}.${appIdSuffix}`;
  }

  return packageName;
}

// Builds the app and runs it on a connected emulator / device.
function buildAndRun(args: Flags) {
  process.chdir(path.join(args.root, 'android'));
  const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';

  // "app" is usually the default value for Android apps with only 1 app
  const {appFolder} = args;
  // @ts-ignore
  const packageName = fs
    .readFileSync(`${appFolder}/src/main/AndroidManifest.xml`, 'utf8')
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
  args: Flags,
  gradlew: 'gradlew.bat' | './gradlew',
  packageNameWithSuffix: string,
  packageName: string,
  adbPath: string,
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

function buildApk(gradlew: string) {
  try {
    // using '-x lint' in order to ignore linting errors while building the apk
    const gradleArgs = ['build', '-x', 'lint'];
    logger.info('Building the app...');
    logger.debug(`Running command "${gradlew} ${gradleArgs.join(' ')}"`);
    execa.sync(gradlew, gradleArgs, {stdio: 'inherit'});
  } catch (error) {
    throw new CLIError('Failed to build the app.', error);
  }
}

function tryInstallAppOnDevice(args: Flags, adbPath: string, device: string) {
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
    execa.sync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (error) {
    throw new CLIError('Failed to install the app on the device.', error);
  }
}

function getInstallApkName(
  appFolder: string,
  adbPath: string,
  variant: string,
  device: string,
  buildDirectory: string,
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
  args: Flags,
  selectedDevice: string,
  packageNameWithSuffix: string,
  packageName: string,
  adbPath: string,
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

// @ts-ignore
function startServerInNewWindow(
  port: number,
  terminal: string,
  reactNativePath: string,
) {
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
   * Quick & temporary fix for packager crashing on Windows due to using removed --projectRoot flag
   * in script. So we just replace the contents of the script with the fixed version. This should be
   * removed when PR #25517 on RN Repo gets approved and a new RN version is released.
   */
  const launchPackagerScriptContent = `:: Copyright (c) Facebook, Inc. and its affiliates.
  ::
  :: This source code is licensed under the MIT license found in the
  :: LICENSE file in the root directory of this source tree.

  @echo off
  title Metro Bundler
  call .packager.bat
  cd ../../../
  node "%~dp0..\\cli.js" start
  pause
  exit`;

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
  const procConfig: execa.SyncOptions = {cwd: scriptsDir};

  /**
   * Ensure we overwrite file by passing the `w` flag
   */
  fs.writeFileSync(packagerEnvFile, portExportContent, {
    encoding: 'utf8',
    flag: 'w',
  });

  if (process.platform === 'darwin') {
    try {
      return execa.sync(
        'open',
        ['-a', terminal, launchPackagerScript],
        procConfig,
      );
    } catch (error) {
      return execa.sync('open', [launchPackagerScript], procConfig);
    }
  }
  if (process.platform === 'linux') {
    try {
      return execa.sync(terminal, ['-e', `sh ${launchPackagerScript}`], {
        ...procConfig,
        detached: true,
      });
    } catch (error) {
      // By default, the child shell process will be attached to the parent
      return execa.sync('sh', [launchPackagerScript], procConfig);
    }
  }
  if (/^win/.test(process.platform)) {
    //Temporary fix for #484. See comment on line 254
    fs.writeFileSync(launchPackagerScript, launchPackagerScriptContent, {
      encoding: 'utf8',
      flag: 'w',
    });

    // Awaiting this causes the CLI to hang indefinitely, so this must execute without await.
    return execa('cmd.exe', ['/C', launchPackagerScript], {
      ...procConfig,
      detached: true,
      stdio: 'ignore',
    });
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
      default: getDefaultUserTerminal(),
    },
    {
      name: '--tasks [list]',
      description: 'Run custom Gradle tasks. By default it\'s "installDebug"',
      parse: (val: string) => val.split(','),
    },
    {
      name: '--no-jetifier',
      description:
        'Do not run "jetifier" – the AndroidX transition tool. By default it runs before Gradle to ease working with libraries that don\'t support AndroidX yet. See more at: https://www.npmjs.com/package/jetifier.',
      default: false,
    },
  ],
};
