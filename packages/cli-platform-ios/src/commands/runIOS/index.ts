/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import child_process from 'child_process';
import path from 'path';
import chalk from 'chalk';
import {Config, IOSProjectInfo} from '@react-native-community/cli-types';
import execa from 'execa';
import {
  logger,
  CLIError,
  getDefaultUserTerminal,
} from '@react-native-community/cli-tools';
import parseIOSDevicesList from '../../tools/parseIOSDevicesList';
import parseXctraceIOSDevicesList from '../../tools/parseXctraceIOSDevicesList';
import findMatchingSimulator from '../../tools/findMatchingSimulator';
import {buildProject} from '../buildIOS/buildProject';
import {Device} from '../../types';

type FlagsT = {
  simulator?: string;
  configuration: string;
  scheme?: string;
  projectPath: string;
  device?: string | true;
  udid?: string;
  packager: boolean;
  verbose: boolean;
  port: number;
  terminal: string | undefined;
  xcconfig?: string;
  buildFolder?: string;
};

function runIOS(_: Array<string>, ctx: Config, args: FlagsT) {
  if (!ctx.project.ios) {
    throw new CLIError(
      'iOS project folder not found. Are you sure this is a React Native project?',
    );
  }

  const {xcodeProject, sourceDir} = ctx.project.ios;

  process.chdir(sourceDir);

  if (!xcodeProject) {
    throw new CLIError(
      `Could not find Xcode project files in "${sourceDir}" folder`,
    );
  }

  const inferredSchemeName = path.basename(
    xcodeProject.name,
    path.extname(xcodeProject.name),
  );
  const scheme = args.scheme || inferredSchemeName;

  logger.info(
    `Found Xcode ${
      xcodeProject.isWorkspace ? 'workspace' : 'project'
    } "${chalk.bold(xcodeProject.name)}"`,
  );

  // No need to load all available devices
  if (!args.device && !args.udid) {
    return runOnSimulator(xcodeProject, scheme, args);
  }

  if (args.device && args.udid) {
    return logger.error(
      'The `device` and `udid` options are mutually exclusive.',
    );
  }

  let devices;
  try {
    const out = execa.sync('xcrun', ['xctrace', 'list', 'devices']);
    devices = parseXctraceIOSDevicesList(
      // Xcode 12.5 introduced a change to output the list to stdout instead of stderr
      out.stderr === '' ? out.stdout : out.stderr,
    );
  } catch (e) {
    logger.warn(
      'Support for Xcode 11 and older is deprecated. Please upgrade to Xcode 12.',
    );
    devices = parseIOSDevicesList(
      execa.sync('xcrun', ['instruments', '-s']).stdout,
    );
  }

  if (args.udid) {
    const device = devices.find((d) => d.udid === args.udid);
    if (!device) {
      return logger.error(
        `Could not find a device with udid: "${chalk.bold(
          args.udid,
        )}". ${printFoundDevices(devices)}`,
      );
    }
    if (device.type === 'simulator') {
      return runOnSimulator(xcodeProject, scheme, args);
    } else {
      return runOnDevice(device, scheme, xcodeProject, args);
    }
  } else {
    const physicalDevices = devices.filter((d) => d.type !== 'simulator');
    const device = matchingDevice(physicalDevices, args.device);
    if (device) {
      return runOnDevice(device, scheme, xcodeProject, args);
    }
  }
}

async function runOnSimulator(
  xcodeProject: IOSProjectInfo,
  scheme: string,
  args: FlagsT,
) {
  let simulators: {devices: {[index: string]: Array<Device>}};
  try {
    simulators = JSON.parse(
      child_process.execFileSync(
        'xcrun',
        ['simctl', 'list', '--json', 'devices'],
        {encoding: 'utf8'},
      ),
    );
  } catch (error) {
    throw new CLIError(
      'Could not get the simulator list from Xcode. Please open Xcode and try running project directly from there to resolve the remaining issues.',
      error,
    );
  }

  /**
   * If provided simulator does not exist, try simulators in following order
   * - iPhone 14
   * - iPhone 13
   * - iPhone 12
   * - iPhone 11
   */
  const fallbackSimulators = [
    'iPhone 14',
    'iPhone 13',
    'iPhone 12',
    'iPhone 11',
  ];
  const selectedSimulator = fallbackSimulators.reduce((simulator, fallback) => {
    return (
      simulator || findMatchingSimulator(simulators, {simulator: fallback})
    );
  }, findMatchingSimulator(simulators, args));

  if (!selectedSimulator) {
    throw new CLIError(
      `No simulator available with ${
        args.simulator ? `name "${args.simulator}"` : `udid "${args.udid}"`
      }`,
    );
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

  const buildOutput = await buildProject(
    xcodeProject,
    selectedSimulator.udid,
    scheme,
    args,
  );

  const appPath = getBuildPath(
    xcodeProject,
    args.configuration,
    buildOutput,
    scheme,
  );

  logger.info(`Installing "${chalk.bold(appPath)}"`);

  child_process.spawnSync(
    'xcrun',
    ['simctl', 'install', selectedSimulator.udid, appPath],
    {stdio: 'inherit'},
  );

  const bundleID = child_process
    .execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print:CFBundleIdentifier', path.join(appPath, 'Info.plist')],
      {encoding: 'utf8'},
    )
    .trim();

  logger.info(`Launching "${chalk.bold(bundleID)}"`);

  const result = child_process.spawnSync('xcrun', [
    'simctl',
    'launch',
    selectedSimulator.udid,
    bundleID,
  ]);

  if (result.status === 0) {
    logger.success('Successfully launched the app on the simulator');
  } else {
    logger.error(
      'Failed to launch the app on simulator',
      result.stderr.toString(),
    );
  }
}

async function runOnDevice(
  selectedDevice: Device,
  scheme: string,
  xcodeProject: IOSProjectInfo,
  args: FlagsT,
) {
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

  const buildOutput = await buildProject(
    xcodeProject,
    selectedDevice.udid,
    scheme,
    args,
  );

  if (selectedDevice.type === 'catalyst') {
    const appPath = getBuildPath(
      xcodeProject,
      args.configuration,
      buildOutput,
      scheme,
      true,
    );
    const appProcess = child_process.spawn(`${appPath}/${scheme}`, [], {
      detached: true,
      stdio: 'ignore',
    });
    appProcess.unref();
  } else {
    const iosDeployInstallArgs = [
      '--bundle',
      getBuildPath(xcodeProject, args.configuration, buildOutput, scheme),
      '--id',
      selectedDevice.udid,
      '--justlaunch',
    ];

    logger.info(`Installing and launching your app on ${selectedDevice.name}`);

    const iosDeployOutput = child_process.spawnSync(
      'ios-deploy',
      iosDeployInstallArgs,
      {encoding: 'utf8'},
    );

    if (iosDeployOutput.error) {
      throw new CLIError(
        `Failed to install the app on the device. We've encountered an error in "ios-deploy" command: ${iosDeployOutput.error.message}`,
      );
    }
  }

  return logger.success('Installed the app on the device.');
}

function bootSimulator(selectedSimulator: Device) {
  const simulatorFullName = formattedDeviceName(selectedSimulator);
  logger.info(`Launching ${simulatorFullName}`);

  child_process.spawnSync('xcrun', ['simctl', 'boot', selectedSimulator.udid]);
}

function getTargetPaths(buildSettings: string) {
  const settings = JSON.parse(buildSettings);

  // Find app in all building settings - look for WRAPPER_EXTENSION: 'app',
  for (const i in settings) {
    const wrapperExtension = settings[i].buildSettings.WRAPPER_EXTENSION;

    if (wrapperExtension === 'app') {
      return {
        targetBuildDir: settings[i].buildSettings.TARGET_BUILD_DIR,
        executableFolderPath: settings[i].buildSettings.EXECUTABLE_FOLDER_PATH,
      };
    }
  }

  return {};
}

function getBuildPath(
  xcodeProject: IOSProjectInfo,
  configuration: string,
  buildOutput: string,
  scheme: string,
  isCatalyst: boolean = false,
) {
  const buildSettings = child_process.execFileSync(
    'xcodebuild',
    [
      xcodeProject.isWorkspace ? '-workspace' : '-project',
      xcodeProject.name,
      '-scheme',
      scheme,
      '-sdk',
      getPlatformName(buildOutput),
      '-configuration',
      configuration,
      '-showBuildSettings',
      '-json',
    ],
    {encoding: 'utf8'},
  );
  const {targetBuildDir, executableFolderPath} = getTargetPaths(buildSettings);

  if (!targetBuildDir) {
    throw new CLIError('Failed to get the target build directory.');
  }

  if (!executableFolderPath) {
    throw new CLIError('Failed to get the app name.');
  }

  return `${targetBuildDir}${
    isCatalyst ? '-maccatalyst' : ''
  }/${executableFolderPath}`;
}

function getPlatformName(buildOutput: string) {
  // Xcode can sometimes escape `=` with a backslash or put the value in quotes
  const platformNameMatch = /export PLATFORM_NAME\\?="?(\w+)"?$/m.exec(
    buildOutput,
  );
  if (!platformNameMatch) {
    throw new CLIError(
      'Couldn\'t find "PLATFORM_NAME" variable in xcodebuild output. Please report this issue and run your project with Xcode instead.',
    );
  }
  return platformNameMatch[1];
}

function matchingDevice(
  devices: Array<Device>,
  deviceName: string | true | undefined,
) {
  if (deviceName === true) {
    const firstIOSDevice = devices.find((d) => d.type === 'device')!;
    if (firstIOSDevice) {
      logger.info(
        `Using first available device named "${chalk.bold(
          firstIOSDevice.name,
        )}" due to lack of name supplied.`,
      );
      return firstIOSDevice;
    } else {
      logger.error('No iOS devices connected.');
      return undefined;
    }
  }
  const deviceByName = devices.find(
    (device) =>
      device.name === deviceName || formattedDeviceName(device) === deviceName,
  );
  if (!deviceByName) {
    logger.error(
      `Could not find a device named: "${chalk.bold(
        String(deviceName),
      )}". ${printFoundDevices(devices)}`,
    );
  }
  return deviceByName;
}

function formattedDeviceName(simulator: Device) {
  return simulator.version
    ? `${simulator.name} (${simulator.version})`
    : simulator.name;
}

function printFoundDevices(devices: Array<Device>) {
  return [
    'Available devices:',
    ...devices.map((device) => `  - ${device.name} (${device.udid})`),
  ].join('\n');
}

export default {
  name: 'run-ios',
  description: 'builds your app and starts it on iOS simulator',
  func: runIOS,
  examples: [
    {
      desc: 'Run on a different simulator, e.g. iPhone SE (2nd generation)',
      cmd: 'react-native run-ios --simulator "iPhone SE (2nd generation)"',
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
      name: '--simulator <string>',
      description:
        'Explicitly set simulator to use. Optionally include iOS version between ' +
        'parenthesis at the end to match an exact version: "iPhone 6 (10.0)"',
      default: 'iPhone 14',
    },
    {
      name: '--configuration <string>',
      description: 'Explicitly set the scheme configuration to use',
      default: 'Debug',
    },
    {
      name: '--scheme <string>',
      description: 'Explicitly set Xcode scheme to use',
    },
    {
      name: '--device [string]',
      description:
        'Explicitly set device to use by name.  The value is not required if you have a single device connected.',
    },
    {
      name: '--udid <string>',
      description: 'Explicitly set device to use by udid',
    },
    {
      name: '--no-packager',
      description: 'Do not launch packager while building',
    },
    {
      name: '--verbose',
      description: 'Do not use xcbeautify or xcpretty even if installed',
    },
    {
      name: '--port <number>',
      default: process.env.RCT_METRO_PORT || 8081,
      parse: Number,
    },
    {
      name: '--terminal <string>',
      description:
        'Launches the Metro Bundler in a new window using the specified terminal path.',
      default: getDefaultUserTerminal,
    },
    {
      name: '--xcconfig [string]',
      description: 'Explicitly set xcconfig to use',
    },
    {
      name: '--buildFolder <string>',
      description:
        'Location for iOS build artifacts. Corresponds to Xcode\'s "-derivedDataPath".',
    },
  ],
};
