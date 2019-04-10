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

import type {ConfigT} from '../../../../cli/src/tools/config/types.flow';

import findXcodeProject from './findXcodeProject';
import parseIOSDevicesList from './parseIOSDevicesList';
import findMatchingSimulator from './findMatchingSimulator';
import {logger, CLIError} from '@react-native-community/cli-tools';

type FlagsT = {
  simulator: string,
  configuration: string,
  scheme: ?string,
  projectPath: string,
  device: ?string,
  udid: ?string,
  packager: boolean,
  verbose: boolean,
  port: number,
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

  const devices = parseIOSDevicesList(
    // $FlowExpectedError https://github.com/facebook/flow/issues/5675
    child_process.execFileSync('xcrun', ['instruments', '-s'], {
      encoding: 'utf8',
    }),
  );

  if (args.device) {
    const selectedDevice = matchingDevice(devices, args.device);
    if (selectedDevice) {
      return runOnDevice(
        selectedDevice,
        scheme,
        xcodeProject,
        args.configuration,
        args.packager,
        args.verbose,
        args.port,
      );
    }
    if (devices && devices.length > 0) {
      // $FlowIssue: args.device is defined in this context
      logger.error(`Could not find device with the name: "${args.device}".
Choose one of the following:${printFoundDevices(devices)}`);
    } else {
      logger.error('No iOS devices connected.');
    }
  } else if (args.udid) {
    // $FlowIssue: args.udid is defined in this context
    return runOnDeviceByUdid(args, scheme, xcodeProject, devices);
  }

  return runOnSimulator(xcodeProject, args, scheme);
}

function runOnDeviceByUdid(
  args: FlagsT & {udid: string},
  scheme,
  xcodeProject,
  devices,
) {
  const selectedDevice = matchingDeviceByUdid(devices, args.udid);

  if (selectedDevice) {
    runOnDevice(
      selectedDevice,
      scheme,
      xcodeProject,
      args.configuration,
      args.packager,
      args.verbose,
      args.port,
    );
    return;
  }

  if (devices && devices.length > 0) {
    // $FlowIssue: args.udid is defined in this context
    logger.error(`Could not find device with the udid: "${args.udid}".
Choose one of the following:\n${printFoundDevices(devices)}`);
  } else {
    logger.error('No iOS devices connected.');
  }
}

async function runOnSimulator(xcodeProject, args, scheme) {
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
  } catch (e) {
    throw new CLIError('Could not parse the simulator list output');
  }

  const selectedSimulator = findMatchingSimulator(simulators, args.simulator);
  if (!selectedSimulator) {
    throw new CLIError(`Could not find ${args.simulator} simulator`);
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
    args.configuration,
    args.packager,
    args.verbose,
    args.port,
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

async function runOnDevice(
  selectedDevice,
  scheme,
  xcodeProject,
  configuration,
  launchPackager,
  verbose,
  port,
) {
  const appName = await buildProject(
    xcodeProject,
    selectedDevice.udid,
    scheme,
    configuration,
    launchPackager,
    verbose,
    port,
  );

  const iosDeployInstallArgs = [
    '--bundle',
    getBuildPath(configuration, appName, true, scheme),
    '--id',
    selectedDevice.udid,
    '--justlaunch',
  ];

  logger.info(`installing and launching your app on ${selectedDevice.name}...`);

  const iosDeployOutput = child_process.spawnSync(
    'ios-deploy',
    iosDeployInstallArgs,
    {encoding: 'utf8'},
  );

  if (iosDeployOutput.error) {
    logger.error(
      '** INSTALLATION FAILED **\nMake sure you have ios-deploy installed globally.\n(e.g "npm install -g ios-deploy")',
    );
  } else {
    logger.info('** INSTALLATION SUCCEEDED **');
  }
}

function buildProject(
  xcodeProject,
  udid,
  scheme,
  configuration,
  launchPackager = false,
  verbose,
  port,
) {
  return new Promise((resolve, reject) => {
    const xcodebuildArgs = [
      xcodeProject.isWorkspace ? '-workspace' : '-project',
      xcodeProject.name,
      '-configuration',
      configuration,
      '-scheme',
      scheme,
      '-destination',
      `id=${udid}`,
      '-derivedDataPath',
      `build/${scheme}`,
    ];
    logger.info(`Building using "xcodebuild ${xcodebuildArgs.join(' ')}"`);
    let xcpretty;
    if (!verbose) {
      xcpretty =
        xcprettyAvailable() &&
        child_process.spawn('xcpretty', [], {
          stdio: ['pipe', process.stdout, process.stderr],
        });
    }
    const buildProcess = child_process.spawn(
      'xcodebuild',
      xcodebuildArgs,
      getProcessOptions(launchPackager, port),
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

function matchingDevice(devices, deviceName) {
  if (deviceName === true && devices.length === 1) {
    logger.info(
      `Using first available device ${
        devices[0].name
      } due to lack of name supplied.`,
    );
    return devices[0];
  }
  for (let i = devices.length - 1; i >= 0; i--) {
    if (
      devices[i].name === deviceName ||
      formattedDeviceName(devices[i]) === deviceName
    ) {
      return devices[i];
    }
  }
  return null;
}

function matchingDeviceByUdid(devices, udid) {
  for (let i = devices.length - 1; i >= 0; i--) {
    if (devices[i].udid === udid) {
      return devices[i];
    }
  }
  return null;
}

function formattedDeviceName(simulator) {
  return `${simulator.name} (${simulator.version})`;
}

function printFoundDevices(devices) {
  let output = '';
  for (let i = devices.length - 1; i >= 0; i--) {
    output += `${devices[i].name} Udid: ${devices[i].udid}\n`;
  }
  return output;
}

function getProcessOptions(launchPackager, port) {
  if (launchPackager) {
    return {
      env: {...process.env, RCT_METRO_PORT: port},
    };
  }

  return {
    env: {...process.env, RCT_NO_LAUNCH_PACKAGER: true},
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
      command: '--simulator [string]',
      description:
        'Explicitly set simulator to use. Optionally include iOS version between' +
        'parenthesis at the end to match an exact version: "iPhone 6 (10.0)"',
      default: 'iPhone X',
    },
    {
      command: '--configuration [string]',
      description: 'Explicitly set the scheme configuration to use',
      default: 'Debug',
    },
    {
      command: '--scheme [string]',
      description: 'Explicitly set Xcode scheme to use',
    },
    {
      command: '--project-path [string]',
      description:
        'Path relative to project root where the Xcode project ' +
        '(.xcodeproj) lives.',
      default: 'ios',
    },
    {
      command: '--device [string]',
      description:
        'Explicitly set device to use by name.  The value is not required if you have a single device connected.',
    },
    {
      command: '--udid [string]',
      description: 'Explicitly set device to use by udid',
    },
    {
      command: '--no-packager',
      description: 'Do not launch packager while building',
    },
    {
      command: '--verbose',
      description: 'Do not use xcpretty even if installed',
    },
    {
      command: '--port [number]',
      default: process.env.RCT_METRO_PORT || 8081,
      parse: (val: string) => Number(val),
    },
  ],
};
