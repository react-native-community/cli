/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import {Config} from '@react-native-community/cli-types';
import {
  logger,
  CLIError,
  link,
  getDefaultUserTerminal,
  startServerInNewWindow,
  findDevServerPort,
  cacheManager,
} from '@react-native-community/cli-tools';
import {BuildFlags, buildOptions} from '../buildIOS/buildOptions';
import {getConfiguration} from '../buildIOS/getConfiguration';
import listIOSDevices from '../../tools/listIOSDevices';
import {promptForDeviceSelection} from '../../tools/prompts';
import getSimulators from '../../tools/getSimulators';
import {getXcodeProjectAndDir} from '../buildIOS/getXcodeProjectAndDir';
import resolvePods, {getPackageJson} from '../../tools/pods';
import getArchitecture from '../../tools/getArchitecture';
import findXcodeProject from '../../config/findXcodeProject';
import {matchingDevice, printFoundDevices} from './matchingDevice';
import {runOnSimulator} from './runOnSimulator';
import {runOnDevice} from './runOnDevice';

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

const PLATFORM = 'ios';

async function runIOS(_: Array<string>, ctx: Config, args: FlagsT) {
  link.setPlatform(PLATFORM);

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
      'lastUsedIOSDeviceId',
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
      if (selectedDevice.udid !== preferredDevice) {
        cacheManager.set(
          packageJson.name,
          'lastUsedIOSDeviceId',
          selectedDevice.udid,
        );
      }
    }

    if (selectedDevice.type === 'simulator') {
      return runOnSimulator(
        xcodeProject,
        PLATFORM,
        mode,
        scheme,
        args,
        selectedDevice,
      );
    } else {
      return runOnDevice(
        selectedDevice,
        PLATFORM,
        mode,
        scheme,
        xcodeProject,
        args,
      );
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
      return runOnSimulator(xcodeProject, PLATFORM, mode, scheme, args);
    }

    logger.info(`Found booted ${booted.map(({name}) => name).join(', ')}`);

    for (const device of devices) {
      await runOnDevice(device, PLATFORM, mode, scheme, xcodeProject, args);
    }

    for (const simulator of bootedSimulators) {
      await runOnSimulator(
        xcodeProject,
        PLATFORM,
        mode,
        scheme,
        args,
        simulator,
      );
    }
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
      return runOnSimulator(xcodeProject, PLATFORM, mode, scheme, args);
    } else {
      return runOnDevice(device, PLATFORM, mode, scheme, xcodeProject, args);
    }
  } else if (args.device) {
    const physicalDevices = availableDevices.filter(
      ({type}) => type !== 'simulator',
    );
    const device = matchingDevice(physicalDevices, args.device);
    if (device) {
      return runOnDevice(device, PLATFORM, mode, scheme, xcodeProject, args);
    }
  } else {
    runOnSimulator(xcodeProject, PLATFORM, mode, scheme, args);
  }
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
