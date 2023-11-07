/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import child_process from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import {Config, IOSProjectInfo} from '@react-native-community/cli-types';
import {getDestinationSimulator} from '../../tools/getDestinationSimulator';
import {
  logger,
  CLIError,
  link,
  getDefaultUserTerminal,
  startServerInNewWindow,
  findDevServerPort,
  cacheManager,
} from '@react-native-community/cli-tools';
import {buildProject} from '../buildIOS/buildProject';
import {BuildFlags, buildOptions} from '../buildIOS/buildOptions';
import {getConfiguration} from '../buildIOS/getConfiguration';
import {Device} from '../../types';
import listIOSDevices from '../../tools/listIOSDevices';
import {promptForDeviceSelection} from '../../tools/prompts';
import getSimulators from '../../tools/getSimulators';
import {getXcodeProjectAndDir} from '../buildIOS/getXcodeProjectAndDir';
import resolvePods, {getPackageJson} from '../../tools/pods';
import getArchitecture from '../../tools/getArchitecture';
import findXcodeProject from '../../config/findXcodeProject';

export interface FlagsT extends BuildFlags {
  simulator?: string;
  device?: string | true;
  udid?: string;
  binaryPath?: string;
  listDevices?: boolean;
  packager?: boolean;
  port: number;
  terminal?: string;
}

async function runIOS(_: Array<string>, ctx: Config, args: FlagsT) {
  link.setPlatform('ios');

  let {packager, port} = args;
  let installedPods = false;
  // check if pods need to be installed
  if (ctx.project.ios?.automaticPodsInstallation || args.forcePods) {
    const isAppRunningNewArchitecture = ctx.project.ios?.sourceDir
      ? await getArchitecture(ctx.project.ios?.sourceDir)
      : undefined;

    await resolvePods(ctx.root, ctx.dependencies, {
      forceInstall: args.forcePods,
      newArchEnabled: isAppRunningNewArchitecture,
    });

    installedPods = true;
  }

  if (packager) {
    const {port: newPort, startPackager} = await findDevServerPort(
      port,
      ctx.root,
    );

    if (startPackager) {
      await startServerInNewWindow(
        newPort,
        ctx.root,
        ctx.reactNativePath,
        args.terminal,
      );
    }
  }

  if (ctx.reactNativeVersion !== 'unknown') {
    link.setVersion(ctx.reactNativeVersion);
  }

  let {xcodeProject, sourceDir} = getXcodeProjectAndDir(ctx.project.ios);

  // if project is freshly created, revisit Xcode project to verify Pods are installed correctly.
  // This is needed because ctx project is created before Pods are installed, so it might have outdated information.
  if (installedPods) {
    const recheckXcodeProject = findXcodeProject(fs.readdirSync(sourceDir));
    if (recheckXcodeProject) {
      xcodeProject = recheckXcodeProject;
    }
  }

  process.chdir(sourceDir);

  if (args.binaryPath) {
    args.binaryPath = path.isAbsolute(args.binaryPath)
      ? args.binaryPath
      : path.join(ctx.root, args.binaryPath);

    if (!fs.existsSync(args.binaryPath)) {
      throw new CLIError(
        'binary-path was specified, but the file was not found.',
      );
    }
  }

  const {mode, scheme} = await getConfiguration(xcodeProject, sourceDir, args);

  const devices = await listIOSDevices();

  const availableDevices = devices.filter(
    ({isAvailable}) => isAvailable === true,
  );

  if (availableDevices.length === 0) {
    return logger.error(
      'iOS devices or simulators not detected. Install simulators via Xcode or connect a physical iOS device',
    );
  }

  if (args.listDevices || args.interactive) {
    if (args.device || args.udid) {
      logger.warn(
        `Both ${
          args.device ? 'device' : 'udid'
        } and "list-devices" parameters were passed to "run" command. We will list available devices and let you choose from one.`,
      );
    }

    const packageJson = getPackageJson(ctx.root);
    const preferredDevice = cacheManager.get(
      packageJson.name,
      'lastUsedDeviceId',
    );

    const selectedDevice = await promptForDeviceSelection(
      availableDevices,
      preferredDevice,
    );

    if (!selectedDevice) {
      throw new CLIError(
        `Failed to select device, please try to run app without ${
          args.listDevices ? 'list-devices' : 'interactive'
        } command.`,
      );
    } else {
      cacheManager.set(
        packageJson.name,
        'lastUsedDeviceId',
        selectedDevice.udid,
      );
    }

    if (selectedDevice.type === 'simulator') {
      return runOnSimulator(xcodeProject, mode, scheme, args, selectedDevice);
    } else {
      return runOnDevice(selectedDevice, mode, scheme, xcodeProject, args);
    }
  }

  if (!args.device && !args.udid && !args.simulator) {
    const bootedDevices = availableDevices.filter(
      ({type}) => type === 'device',
    );

    const simulators = getSimulators();
    const bootedSimulators = Object.keys(simulators.devices)
      .map((key) => simulators.devices[key])
      .reduce((acc, val) => acc.concat(val), [])
      .filter(({state}) => state === 'Booted');

    const booted = [...bootedDevices, ...bootedSimulators];
    if (booted.length === 0) {
      logger.info(
        'No booted devices or simulators found. Launching first available simulator...',
      );
      return runOnSimulator(xcodeProject, mode, scheme, args);
    }

    logger.info(`Found booted ${booted.map(({name}) => name).join(', ')}`);

    return runOnBootedDevicesSimulators(
      mode,
      scheme,
      xcodeProject,
      args,
      bootedDevices,
      bootedSimulators,
    );
  }

  if (args.device && args.udid) {
    return logger.error(
      'The `device` and `udid` options are mutually exclusive.',
    );
  }

  if (args.udid) {
    const device = availableDevices.find((d) => d.udid === args.udid);
    if (!device) {
      return logger.error(
        `Could not find a device with udid: "${chalk.bold(
          args.udid,
        )}". ${printFoundDevices(availableDevices)}`,
      );
    }
    if (device.type === 'simulator') {
      return runOnSimulator(xcodeProject, mode, scheme, args);
    } else {
      return runOnDevice(device, mode, scheme, xcodeProject, args);
    }
  } else if (args.device) {
    const physicalDevices = availableDevices.filter(
      ({type}) => type !== 'simulator',
    );
    const device = matchingDevice(physicalDevices, args.device);
    if (device) {
      return runOnDevice(device, mode, scheme, xcodeProject, args);
    }
  } else {
    runOnSimulator(xcodeProject, mode, scheme, args);
  }
}

async function runOnBootedDevicesSimulators(
  mode: string,
  scheme: string,
  xcodeProject: IOSProjectInfo,
  args: FlagsT,
  devices: Device[],
  simulators: Device[],
) {
  for (const device of devices) {
    await runOnDevice(device, mode, scheme, xcodeProject, args);
  }

  for (const simulator of simulators) {
    await runOnSimulator(xcodeProject, mode, scheme, args, simulator);
  }
}

async function runOnSimulator(
  xcodeProject: IOSProjectInfo,
  mode: string,
  scheme: string,
  args: FlagsT,
  simulator?: Device,
) {
  /**
   * If provided simulator does not exist, try simulators in following order
   * - iPhone 14
   * - iPhone 13
   * - iPhone 12
   * - iPhone 11
   */

  let selectedSimulator;
  if (simulator) {
    selectedSimulator = simulator;
  } else {
    const fallbackSimulators = [
      'iPhone 14',
      'iPhone 13',
      'iPhone 12',
      'iPhone 11',
    ];
    selectedSimulator = getDestinationSimulator(args, fallbackSimulators);
  }

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

  if (selectedSimulator.state !== 'Booted') {
    bootSimulator(selectedSimulator);
  }

  let buildOutput, appPath;
  if (!args.binaryPath) {
    buildOutput = await buildProject(
      xcodeProject,
      selectedSimulator.udid,
      mode,
      scheme,
      args,
    );

    appPath = await getBuildPath(
      xcodeProject,
      mode,
      buildOutput,
      scheme,
      args.target,
    );
  } else {
    appPath = args.binaryPath;
  }

  logger.info(
    `Installing "${chalk.bold(appPath)} on ${selectedSimulator.name}"`,
  );

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
  mode: string,
  scheme: string,
  xcodeProject: IOSProjectInfo,
  args: FlagsT,
) {
  if (args.binaryPath && selectedDevice.type === 'catalyst') {
    throw new CLIError(
      'binary-path was specified for catalyst device, which is not supported.',
    );
  }

  const isIOSDeployInstalled = child_process.spawnSync(
    'ios-deploy',
    ['--version'],
    {encoding: 'utf8'},
  );

  if (isIOSDeployInstalled.error) {
    throw new CLIError(
      `Failed to install the app on the device because we couldn't execute the "ios-deploy" command. Please install it by running "${chalk.bold(
        'brew install ios-deploy',
      )}" and try again.`,
    );
  }

  if (selectedDevice.type === 'catalyst') {
    const buildOutput = await buildProject(
      xcodeProject,
      selectedDevice.udid,
      mode,
      scheme,
      args,
    );

    const appPath = await getBuildPath(
      xcodeProject,
      mode,
      buildOutput,
      scheme,
      args.target,
      true,
    );
    const appProcess = child_process.spawn(`${appPath}/${scheme}`, [], {
      detached: true,
      stdio: 'ignore',
    });
    appProcess.unref();
  } else {
    let buildOutput, appPath;
    if (!args.binaryPath) {
      buildOutput = await buildProject(
        xcodeProject,
        selectedDevice.udid,
        mode,
        scheme,
        args,
      );

      appPath = await getBuildPath(
        xcodeProject,
        mode,
        buildOutput,
        scheme,
        args.target,
      );
    } else {
      appPath = args.binaryPath;
    }

    const iosDeployInstallArgs = [
      '--bundle',
      appPath,
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

async function getTargetPaths(
  buildSettings: string,
  scheme: string,
  target: string | undefined,
) {
  const settings = JSON.parse(buildSettings);

  const targets = settings.map(
    ({target: settingsTarget}: any) => settingsTarget,
  );

  let selectedTarget = targets[0];

  if (target) {
    if (!targets.includes(target)) {
      logger.info(
        `Target ${chalk.bold(target)} not found for scheme ${chalk.bold(
          scheme,
        )}, automatically selected target ${chalk.bold(selectedTarget)}`,
      );
    } else {
      selectedTarget = target;
    }
  }

  // Find app in all building settings - look for WRAPPER_EXTENSION: 'app',

  const targetIndex = targets.indexOf(selectedTarget);

  const wrapperExtension =
    settings[targetIndex].buildSettings.WRAPPER_EXTENSION;

  if (wrapperExtension === 'app') {
    return {
      targetBuildDir: settings[targetIndex].buildSettings.TARGET_BUILD_DIR,
      executableFolderPath:
        settings[targetIndex].buildSettings.EXECUTABLE_FOLDER_PATH,
    };
  }

  return {};
}

async function getBuildPath(
  xcodeProject: IOSProjectInfo,
  mode: string,
  buildOutput: string,
  scheme: string,
  target: string | undefined,
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
      mode,
      '-showBuildSettings',
      '-json',
    ],
    {encoding: 'utf8'},
  );

  const {targetBuildDir, executableFolderPath} = await getTargetPaths(
    buildSettings,
    scheme,
    target,
  );

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
      cmd: 'npx react-native run-ios --simulator "iPhone SE (2nd generation)"',
    },
    {
      desc: "Run on a connected device, e.g. Max's iPhone",
      cmd: 'npx react-native run-ios --device "Max\'s iPhone"',
    },
    {
      desc: 'Run on the AppleTV simulator',
      cmd: 'npx react-native run-ios --simulator "Apple TV"  --scheme "helloworld-tvOS"',
    },
  ],
  options: [
    ...buildOptions,
    {
      name: '--no-packager',
      description: 'Do not launch packager while running the app',
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
      default: getDefaultUserTerminal(),
    },
    {
      name: '--binary-path <string>',
      description:
        'Path relative to project root where pre-built .app binary lives.',
    },
    {
      name: '--list-devices',
      description:
        'List all available iOS devices and simulators and let you choose one to run the app. ',
    },
    {
      name: '--simulator <string>',
      description:
        'Explicitly set the simulator to use. Optionally set the iOS version ' +
        'between parentheses at the end to match an exact version: ' +
        '"iPhone 15 (17.0)"',
    },
    {
      name: '--device <string>',
      description:
        'Explicitly set the device to use by name. The value is not required ' +
        'if you have a single device connected.',
    },
    {
      name: '--udid <string>',
      description: 'Explicitly set the device to use by UDID',
    },
  ],
};
