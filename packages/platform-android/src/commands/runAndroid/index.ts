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

// Validates that the package name is correct
function validatePackageName(packageName: string) {
  return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName);
}

function displayWarnings(config: Config, args: Flags) {
  warnAboutManuallyLinkedLibs(config);
  if (args.appId) {
    logger.warn(
      'Using deprecated "--appId" flag. Use "platforms.android.appName" in react-native.config.js instead.',
    );
  }
  if (args.appFolder) {
    logger.warn(
      'Using deprecated "--appFolder" flag. Use "platforms.android.appName" in react-native.config.js instead.',
    );
  }
  if (args.root) {
    logger.warn(
      'Using deprecated "--root" flag. App root is discovered automatically.',
    );
  }
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

type AndroidProject = NonNullable<Config['project']['android']>;

/**
 * Starts the app on a connected Android emulator or device.
 */
async function runAndroid(_argv: Array<string>, config: Config, args: Flags) {
  displayWarnings(config, args);
  const androidProject = config.project.android;

  if (!androidProject) {
    throw new CLIError(`
  Android project not found. Are you sure this is a React Native project?
  If your Android files are located in a non-standard location (e.g. not inside \'android\' folder), consider setting
  \`project.android.sourceDir\` option to point to a new location.
`);
  }

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
    return buildAndRun(args, androidProject);
  }

  return isPackagerRunning(args.port).then((result: string) => {
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
    return buildAndRun(args, androidProject);
  });
}

// Builds the app and runs it on a connected emulator / device.
function buildAndRun(args: Flags, androidProject: AndroidProject) {
  process.chdir(path.join(args.root, 'android'));
  const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';

  // "app" is usually the default value for Android apps with only 1 app
  const {appName} = androidProject;
  const {appFolder} = args;
  // @ts-ignore
  const androidManifest = fs.readFileSync(
    `${appFolder || appName}/src/main/AndroidManifest.xml`,
    'utf8',
  );

  let packageNameMatchArray = androidManifest.match(/package="(.+?)"/);
  if (!packageNameMatchArray || packageNameMatchArray.length === 0) {
    throw new CLIError(
      `Failed to build the app: No package name found. Found errors in ${chalk.underline.dim(
        `${appFolder || appName}/src/main/AndroidManifest.xml`,
      )}`,
    );
  }

  let packageName = packageNameMatchArray[1];

  if (!validatePackageName(packageName)) {
    logger.warn(
      `Invalid application's package name "${chalk.bgRed(
        packageName,
      )}" in 'AndroidManifest.xml'. Read guidelines for setting the package name here: ${chalk.underline.dim(
        'https://developer.android.com/studio/build/application-id',
      )}`,
    ); // we can also directly add the package naming rules here
  }

  const adbPath = getAdbPath();
  if (args.deviceId) {
    return runOnSpecificDevice(args, cmd, packageName, adbPath, androidProject);
  } else {
    return runOnAllDevices(args, cmd, packageName, adbPath, androidProject);
  }
}

function runOnSpecificDevice(
  args: Flags,
  gradlew: 'gradlew.bat' | './gradlew',
  packageName: string,
  adbPath: string,
  androidProject: AndroidProject,
) {
  const devices = adb.getDevices(adbPath);
  const {deviceId} = args;
  if (devices.length > 0 && deviceId) {
    if (devices.indexOf(deviceId) !== -1) {
      buildApk(gradlew, androidProject.sourceDir);
      installAndLaunchOnDevice(
        args,
        deviceId,
        packageName,
        adbPath,
        androidProject,
      );
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

function buildApk(gradlew: string, sourceDir: string) {
  try {
    // using '-x lint' in order to ignore linting errors while building the apk
    const gradleArgs = ['build', '-x', 'lint'];
    logger.info('Building the app...');
    logger.debug(`Running command "${gradlew} ${gradleArgs.join(' ')}"`);
    execa.sync(gradlew, gradleArgs, {stdio: 'inherit', cwd: sourceDir});
  } catch (error) {
    throw new CLIError('Failed to build the app.', error);
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
    const {appFolder} = args;
    const variant = args.variant.toLowerCase();
    const buildDirectory = `${sourceDir}/${appName}/build/outputs/apk/${variant}`;
    const apkFile = getInstallApkName(
      appFolder || appName, // TODO: remove appFolder
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
  packageName: string,
  adbPath: string,
  androidProject: AndroidProject,
) {
  tryRunAdbReverse(args.port, selectedDevice);
  tryInstallAppOnDevice(args, adbPath, selectedDevice, androidProject);
  tryLaunchAppOnDevice(selectedDevice, packageName, adbPath, args);
}

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
  return;
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
        '[DEPRECATED - root is discovered automatically] Override the root directory for the android build (which contains the android directory)',
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
        '[DEPRECATED – use "platforms.android.appName" in react-native.config.js] Specify a different application folder name for the android source. If not, we assume is "app"',
    },
    {
      name: '--appId [string]',
      description:
        '[DEPRECATED – use "platforms.android.appName" in react-native.config.js] Specify an applicationId to launch after build.',
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
