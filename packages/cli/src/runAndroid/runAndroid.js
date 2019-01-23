/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable consistent-return */

import type { ContextT } from '../core/types.flow';

const chalk = require('chalk');
const { spawnSync, spawn, execFileSync } = require('child_process');
const fs = require('fs');
const isString = require('lodash/isString');
const path = require('path');
const findReactNativeScripts = require('../util/findReactNativeScripts');
const isPackagerRunning = require('../util/isPackagerRunning');
const adb = require('./adb');
const runOnAllDevices = require('./runOnAllDevices');
const tryRunAdbReverse = require('./tryRunAdbReverse');
const tryLaunchAppOnDevice = require('./tryLaunchAppOnDevice');
const getAdbPath = require('./getAdbPath');

// Verifies this is an Android project
function checkAndroid(root) {
  return fs.existsSync(path.join(root, 'android/gradlew'));
}

/**
 * Starts the app on a connected Android emulator or device.
 */
function runAndroid(argv: Array<string>, config: ContextT, args: Object) {
  if (!checkAndroid(args.root)) {
    const reactNativeScriptsPath = findReactNativeScripts();
    if (reactNativeScriptsPath) {
      spawnSync(
        reactNativeScriptsPath,
        ['android'].concat(process.argv.slice(1)),
        { stdio: 'inherit' }
      );
    } else {
      console.log(
        chalk.red(
          'Android project not found. Maybe run react-native android first?'
        )
      );
    }
    return;
  }

  if (!args.packager) {
    return buildAndRun(args);
  }

  return isPackagerRunning(args.port).then(result => {
    if (result === 'running') {
      console.log(chalk.bold('JS server already running.'));
    } else if (result === 'unrecognized') {
      console.warn(
        chalk.yellow('JS server not recognized, continuing with build...')
      );
    } else {
      // result == 'not_running'
      console.log(chalk.bold('Starting JS server...'));
      startServerInNewWindow(args.port, args.terminal);
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
  const appFolder = args.appFolder || 'app';
  const packageName = fs
    .readFileSync(`${appFolder}/src/main/AndroidManifest.xml`, 'utf8')
    // $FlowFixMe
    .match(/package="(.+?)"/)[1];

  const packageNameWithSuffix = getPackageNameWithSuffix(
    args.appId,
    args.appIdSuffix,
    packageName
  );

  const adbPath = getAdbPath();
  if (args.deviceId) {
    if (isString(args.deviceId)) {
      return runOnSpecificDevice(
        args,
        cmd,
        packageNameWithSuffix,
        packageName,
        adbPath
      );
    }
    console.log(chalk.red('Argument missing for parameter --deviceId'));
  } else {
    return runOnAllDevices(
      args,
      cmd,
      packageNameWithSuffix,
      packageName,
      adbPath
    );
  }
}

function runOnSpecificDevice(
  args,
  gradlew,
  packageNameWithSuffix,
  packageName,
  adbPath
) {
  const devices = adb.getDevices();
  if (devices && devices.length > 0) {
    if (devices.indexOf(args.deviceId) !== -1) {
      buildApk(gradlew);
      installAndLaunchOnDevice(
        args,
        args.deviceId,
        packageNameWithSuffix,
        packageName,
        adbPath
      );
    } else {
      console.log(`Could not find device with the id: "${args.deviceId}".`);
      console.log('Choose one of the following:');
      console.log(devices);
    }
  } else {
    console.log('No Android devices connected.');
  }
}

function buildApk(gradlew) {
  try {
    console.log(chalk.bold('Building the app...'));

    // using '-x lint' in order to ignore linting errors while building the apk
    execFileSync(gradlew, ['build', '-x', 'lint'], {
      stdio: [process.stdin, process.stdout, process.stderr],
    });
  } catch (e) {
    console.log(
      chalk.red('Could not build the app, read the error above for details.\n')
    );
  }
}

function tryInstallAppOnDevice(args, device) {
  try {
    // "app" is usually the default value for Android apps with only 1 app
    const appFolder = args.appFolder || 'app';
    const pathToApk = `${appFolder}/build/outputs/apk/${appFolder}-debug.apk`;
    const adbPath = getAdbPath();
    const adbArgs = ['-s', device, 'install', pathToApk];
    console.log(
      chalk.bold(
        `Installing the app on the device (cd android && adb -s ${device} install ${pathToApk}`
      )
    );
    execFileSync(adbPath, adbArgs, {
      stdio: [process.stdin, process.stdout, process.stderr],
    });
  } catch (e) {
    console.log(e.message);
    console.log(
      chalk.red(
        'Could not install the app on the device, read the error above for details.\n'
      )
    );
  }
}

function installAndLaunchOnDevice(
  args,
  selectedDevice,
  packageNameWithSuffix,
  packageName,
  adbPath
) {
  tryRunAdbReverse(args.port, selectedDevice);
  tryInstallAppOnDevice(args, selectedDevice);
  tryLaunchAppOnDevice(
    selectedDevice,
    packageNameWithSuffix,
    packageName,
    adbPath,
    args.mainActivity
  );
}

function startServerInNewWindow(port, terminal = process.env.REACT_TERMINAL) {
  // set up OS-specific filenames and commands
  const isWindows = /^win/.test(process.platform);
  const scriptFile = isWindows
    ? 'launchPackager.bat'
    : 'launchPackager.command';
  const packagerEnvFilename = isWindows ? '.packager.bat' : '.packager.env';
  const portExportContent = isWindows
    ? `set RCT_METRO_PORT=${port}`
    : `export RCT_METRO_PORT=${port}`;

  // set up the launchpackager.(command|bat) file
  const scriptsDir = path.resolve(__dirname, '..', '..', 'scripts');
  const launchPackagerScript = path.resolve(scriptsDir, scriptFile);
  const procConfig: Object = { cwd: scriptsDir };

  // set up the .packager.(env|bat) file to ensure the packager starts on the right port
  const packagerEnvFile = path.join(
    __dirname,
    '..',
    '..',
    'scripts',
    packagerEnvFilename
  );

  // ensure we overwrite file by passing the 'w' flag
  fs.writeFileSync(packagerEnvFile, portExportContent, {
    encoding: 'utf8',
    flag: 'w',
  });

  if (process.platform === 'darwin') {
    if (terminal) {
      return spawnSync(
        'open',
        ['-a', terminal, launchPackagerScript],
        procConfig
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
  console.log(
    chalk.red(`Cannot start the packager. Unknown platform ${process.platform}`)
  );
}

module.exports = {
  name: 'run-android',
  description:
    'builds your app and starts it on a connected Android emulator or device',
  func: runAndroid,
  options: [
    {
      command: '--install-debug',
    },
    {
      command: '--root [string]',
      description:
        'Override the root directory for the android build (which contains the android directory)',
      default: '',
    },
    {
      command: '--flavor [string]',
      description: '--flavor has been deprecated. Use --variant instead',
    },
    {
      command: '--variant [string]',
    },
    {
      command: '--appFolder [string]',
      description:
        'Specify a different application folder name for the android source. If not, we assume is "app"',
    },
    {
      command: '--appId [string]',
      description: 'Specify an applicationId to launch after build.',
      default: '',
    },
    {
      command: '--appIdSuffix [string]',
      description: 'Specify an applicationIdSuffix to launch after build.',
      default: '',
    },
    {
      command: '--main-activity [string]',
      description: 'Name of the activity to start',
      default: 'MainActivity',
    },
    {
      command: '--deviceId [string]',
      description:
        'builds your app and starts it on a specific device/simulator with the ' +
        'given device id (listed by running "adb devices" on the command line).',
    },
    {
      command: '--no-packager',
      description: 'Do not launch packager while building',
    },
    {
      command: '--port [number]',
      default: process.env.RCT_METRO_PORT || 8081,
      parse: (val: string) => Number(val),
    },
    {
      command: '--terminal [string]',
      description:
        'Launches the Metro Bundler in a new window using the specified terminal path.',
      default: '',
    },
  ],
};
