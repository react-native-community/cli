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
import {Config} from '@react-native-community/cli-types';
import {
  logger,
  CLIError,
  getDefaultUserTerminal,
} from '@react-native-community/cli-tools';
import execa from 'execa';
import parseXctraceIOSDevicesList from '../runIOS/parseXctraceIOSDevicesList';
import parseIOSDevicesList from '../runIOS/parseIOSDevicesList';
import {Device} from '../../types';
import {buildProject} from './buildProject';
import findMatchingSimulator from '../runIOS/findMatchingSimulator';

type FlagsT = {
  configuration: string;
  simulator?: string;
  scheme?: string;
  device?: string | true;
  udid?: string;
  verbose: boolean;
  port: number;
  terminal: string | undefined;
  xcconfig?: string;
  buildFolder?: string;
};

function buildIOS(_: Array<string>, ctx: Config, args: FlagsT) {
  console.log(JSON.stringify(args));
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

  const extendedArgs = {
    ...args,
    packager: false,
  };

  // // No need to load all available devices
  if (!args.device && !args.udid) {
    const selectedSimulator = getSelectedSimulator(args);
    return buildProject(
      xcodeProject,
      selectedSimulator.udid,
      scheme,
      extendedArgs,
    );
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

    return buildProject(xcodeProject, device.udid, scheme, extendedArgs);
  } else {
    const physicalDevices = devices.filter((d) => d.type !== 'simulator');
    const device = matchingDevice(physicalDevices, args.device);
    if (device) {
      return buildProject(xcodeProject, device.udid, scheme, extendedArgs);
    }
  }
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

function getSelectedSimulator(args: FlagsT) {
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
  return selectedSimulator;
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
  name: 'build-ios',
  description: 'builds your app on iOS simulator',
  func: buildIOS,
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
