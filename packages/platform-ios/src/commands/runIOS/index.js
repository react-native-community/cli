/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type {ConfigT} from 'types';
import findXcodeProject from './findXcodeProject';
import parseIOSDevicesList from './parseIOSDevicesList';
import findMatchingSimulator from './findMatchingSimulator';
import {
  logger,
  CLIError,
  getDefaultUserTerminal,
} from '@react-native-community/cli-tools';

type FlagsT = {
  simulator: string,
  configuration: string,
  scheme: ?string,
  projectPath: string,
  device: ?(string | true),
  udid: ?string,
  packager: boolean,
  verbose: boolean,
  port: number,
  terminal: ?string,
};

function runIOS(_: Array<string>, ctx: ConfigT, args: FlagsT) {
  if (!fs.existsSync(args.projectPath)) {
    throw new CLIError(
      'iOS project folder not found. Are you sure this is a React Native project?',
    );
  }

  process.chdir(args.projectPath);

  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    throw new CLIError(
      `Could not find Xcode project files in "${args.projectPath}" folder`,
    );
  }

  const inferredSchemeName = path.basename(
    xcodeProject.name,
    path.extname(xcodeProject.name),
  );
  const scheme = args.scheme || inferredSchemeName;

  logger.info(
    `Found Xcode ${xcodeProject.isWorkspace ? 'workspace' : 'project'} ${
      xcodeProject.name
    }`,
  );

  const {device, udid} = args;

  if (!device && !udid) {
    return runOnSimulator(xcodeProject, scheme, args);
  }

  const devices = parseIOSDevicesList(
    // $FlowExpectedError https://github.com/facebook/flow/issues/5675
    child_process.execFileSync('xcrun', ['instruments', '-s'], {
      encoding: 'utf8',
    }),
  );

  if (devices.length === 0) {
    return logger.error('No iOS devices connected.');
  }

  const selectedDevice = matchingDevice(devices, device, udid);

  if (selectedDevice) {
    return runOnDevice(selectedDevice, scheme, xcodeProject, args);
  }

  if (device) {
    return logger.error(
      `Could not find a device named: "${chalk.bold(
        device,
      )}". ${printFoundDevices(devices)}`,
    );
  }

  if (udid) {
    return logger.error(
      `Could not find a device with udid: "${chalk.bold(
        udid,
      )}". ${printFoundDevices(devices)}`,
    );
  }
}

async function runOnSimulator(xcodeProject, scheme, args: FlagsT) {
  let simulators;
  try {
    simulators = JSON.parse(
      // $FlowIssue: https://github.com/facebook/flow/issues/5675
      child_process.execFileSync(
        'xcrun',
        ['simctl', 'list', '--json', 'devices'],
        {encoding: 'utf8'},
      ),
    );
  } catch (error) {
    throw new CLIError('Could not parse the simulator list output', error);
  }

  const selectedSimulator = findMatchingSimulator(simulators, args.simulator);
  if (!selectedSimulator) {
    throw new CLIError(`Could not find "${args.simulator}" simulator`);
  }

  /**
   * Booting simulator through `xcrun simctl boot` will boot it in the `headless` mode
   * (running in the background).
   *
   * In order for user to see the app and the simulator itself, we have to make sure
   * that the Simulator.app is running.
   *
   * We also pass it `-CurrentDeviceUDID` so that when we launch it for the first time,
   * it will not boot the "default" device, but the one we set. If the app is already running,
   * this flag has no effect.
   */
  const activeDeveloperDir = child_process
    .execFileSync('xcode-select', ['-p'], {encoding: 'utf8'})
    // $FlowExpectedError https://github.com/facebook/flow/issues/5675
    .trim();

  child_process.execFileSync('open', [
    `${activeDeveloperDir}/Applications/Simulator.app`,
    '--args',
    '-CurrentDeviceUDID',
    selectedSimulator.udid,
  ]);

  if (!selectedSimulator.booted) {
    bootSimulator(selectedSimulator);
  }

  const appName = await buildProject(
    xcodeProject,
    selectedSimulator.udid,
    scheme,
    args,
  );

  const appPath = getBuildPath(args.configuration, appName, false, scheme);

  logger.info(`Installing ${appPath}`);

  child_process.spawnSync(
    'xcrun',
    ['simctl', 'install', selectedSimulator.udid, appPath],
    {
      stdio: 'inherit',
    },
  );

  const bundleID = child_process
    .execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print:CFBundleIdentifier', path.join(appPath, 'Info.plist')],
      {encoding: 'utf8'},
    )
    // $FlowExpectedError https://github.com/facebook/flow/issues/5675
    .trim();

  logger.info(`Launching ${bundleID}`);

  child_process.spawnSync(
    'xcrun',
    ['simctl', 'launch', selectedSimulator.udid, bundleID],
    {
      stdio: 'inherit',
    },
  );
}

async function runOnDevice(selectedDevice, scheme, xcodeProject, args: FlagsT) {
  const isIOSDeployInstalled = child_process.spawnSync(
    'ios-deploy',
    ['--version'],
    {encoding: 'utf8'},
  );

  if (isIOSDeployInstalled.error) {
    throw new CLIError(
      `Failed to install the app on the device because we couldn't execute the "ios-deploy" command. Please install it by running "${chalk.bold(
        'npm install -g ios-deploy',
      )}" and try again.`,
    );
  }

  const appName = await buildProject(
    xcodeProject,
    selectedDevice.udid,
    scheme,
    args,
  );

  const iosDeployInstallArgs = [
    '--bundle',
    getBuildPath(args.configuration, appName, true, scheme),
    '--id',
    selectedDevice.udid,
    '--justlaunch',
  ];

  logger.info(`Installing and launching your app on ${selectedDevice.name}...`);

  const iosDeployOutput = child_process.spawnSync(
    'ios-deploy',
    iosDeployInstallArgs,
    {encoding: 'utf8'},
  );

  if (iosDeployOutput.error) {
    throw new CLIError(
      `Failed to install the app on the device. We've encountered an error in "ios-deploy" command: ${
        iosDeployOutput.error.message
      }`,
    );
  }

  return logger.success('Installed the app on the device.');
}

function buildProject(xcodeProject, udid, scheme, args: FlagsT) {
  return new Promise((resolve, reject) => {
    const xcodebuildArgs = [
      xcodeProject.isWorkspace ? '-workspace' : '-project',
      xcodeProject.name,
      '-configuration',
      args.configuration,
      '-scheme',
      scheme,
      '-destination',
      `id=${udid}`,
      '-derivedDataPath',
      `build/${scheme}`,
    ];
    logger.info(`Building using "xcodebuild ${xcodebuildArgs.join(' ')}"`);
    let xcpretty;
    if (!args.verbose) {
      xcpretty =
        xcprettyAvailable() &&
        child_process.spawn('xcpretty', [], {
          stdio: ['pipe', process.stdout, process.stderr],
        });
    }
    const buildProcess = child_process.spawn(
      'xcodebuild',
      xcodebuildArgs,
      getProcessOptions(args),
    );
    let buildOutput = '';
    let errorOutput = '';
    buildProcess.stdout.on('data', data => {
      buildOutput += data.toString();
      if (xcpretty) {
        xcpretty.stdin.write(data);
      } else {
        logger.info(data.toString());
      }
    });
    buildProcess.stderr.on('data', data => {
      errorOutput += data;
    });
    buildProcess.on('close', code => {
      if (xcpretty) {
        xcpretty.stdin.end();
      }
      if (code !== 0) {
        reject(
          new CLIError(
            `
            Failed to build iOS project.

            We ran "xcodebuild" command but it exited with error code ${code}. To debug build
            logs further, consider building your app with Xcode.app, by opening
            ${xcodeProject.name}.
          `,
            errorOutput,
          ),
        );
        return;
      }
      resolve(getProductName(buildOutput) || scheme);
    });
  });
}

function bootSimulator(selectedSimulator) {
  const simulatorFullName = formattedDeviceName(selectedSimulator);
  logger.info(`Launching ${simulatorFullName}...`);
  try {
    child_process.spawnSync('xcrun', [
      'instruments',
      '-w',
      selectedSimulator.udid,
    ]);
  } catch (_ignored) {
    // instruments always fail with 255 because it expects more arguments,
    // but we want it to only launch the simulator
  }
}

function getBuildPath(configuration, appName, isDevice, scheme) {
  let device;

  if (isDevice) {
    device = 'iphoneos';
  } else if (appName.toLowerCase().includes('tvos')) {
    device = 'appletvsimulator';
  } else {
    device = 'iphonesimulator';
  }

  return `build/${scheme}/Build/Products/${configuration}-${device}/${appName}.app`;
}

function getProductName(buildOutput) {
  const productNameMatch = /export FULL_PRODUCT_NAME="?(.+).app"?$/m.exec(
    buildOutput,
  );
  return productNameMatch ? productNameMatch[1] : null;
}

function xcprettyAvailable() {
  try {
    child_process.execSync('xcpretty --version', {
      stdio: [0, 'pipe', 'ignore'],
    });
  } catch (error) {
    return false;
  }
  return true;
}

function matchingDevice(devices, deviceName, udid) {
  if (udid) {
    return matchingDeviceByUdid(devices, udid);
  }
  if (deviceName === true && devices.length === 1) {
    logger.info(
      `Using first available device named "${chalk.bold(
        devices[0].name,
      )}" due to lack of name supplied.`,
    );
    return devices[0];
  }
  return devices.find(
    device =>
      device.name === deviceName || formattedDeviceName(device) === deviceName,
  );
}

function matchingDeviceByUdid(devices, udid) {
  return devices.find(device => device.udid === udid);
}

function formattedDeviceName(simulator) {
  return `${simulator.name} (${simulator.version})`;
}

function printFoundDevices(devices) {
  return [
    'Available devices:',
    ...devices.map(device => `  - ${device.name} (${device.udid})`),
  ].join('\n');
}

function getProcessOptions({packager, terminal, port}) {
  if (packager) {
    return {
      env: {...process.env, RCT_TERMINAL: terminal, RCT_METRO_PORT: port},
    };
  }

  return {
    env: {...process.env, RCT_TERMINAL: terminal, RCT_NO_LAUNCH_PACKAGER: true},
  };
}

export default {
  name: 'run-ios',
  description: 'builds your app and starts it on iOS simulator',
  func: runIOS,
  examples: [
    {
      desc: 'Run on a different simulator, e.g. iPhone 5',
      cmd: 'react-native run-ios --simulator "iPhone 5"',
    },
    {
      desc: 'Pass a non-standard location of iOS directory',
      cmd: 'react-native run-ios --project-path "./app/ios"',
    },
    {
      desc: "Run on a connected device, e.g. Max's iPhone",
      cmd: 'react-native run-ios --device "Max\'s iPhone"',
    },
    {
      desc: 'Run on the AppleTV simulator',
      cmd:
        'react-native run-ios --simulator "Apple TV"  --scheme "helloworld-tvOS"',
    },
  ],
  options: [
    {
      name: '--simulator [string]',
      description:
        'Explicitly set simulator to use. Optionally include iOS version between' +
        'parenthesis at the end to match an exact version: "iPhone 6 (10.0)"',
      default: 'iPhone X',
    },
    {
      name: '--configuration [string]',
      description: 'Explicitly set the scheme configuration to use',
      default: 'Debug',
    },
    {
      name: '--scheme [string]',
      description: 'Explicitly set Xcode scheme to use',
    },
    {
      name: '--project-path [string]',
      description:
        'Path relative to project root where the Xcode project ' +
        '(.xcodeproj) lives.',
      default: 'ios',
    },
    {
      name: '--device [string]',
      description:
        'Explicitly set device to use by name.  The value is not required if you have a single device connected.',
    },
    {
      name: '--udid [string]',
      description: 'Explicitly set device to use by udid',
    },
    {
      name: '--no-packager',
      description: 'Do not launch packager while building',
    },
    {
      name: '--verbose',
      description: 'Do not use xcpretty even if installed',
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
  ],
};
