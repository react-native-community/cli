/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import chalk from 'chalk';
import {Config} from '@react-native-community/cli-types';
import {
  logger,
  CLIError,
  getDefaultUserTerminal,
} from '@react-native-community/cli-tools';
import {Device} from '../../types';
import {BuildFlags, buildProject} from './buildProject';
import {getDestinationSimulator} from '../../tools/getDestinationSimulator';
import {selectFromInteractiveMode} from '../../tools/selectFromInteractiveMode';
import {getProjectInfo} from '../../tools/getProjectInfo';
import {checkIfConfigurationExists} from '../../tools/checkIfConfigurationExists';
import {getConfigurationScheme} from '../../tools/getConfigurationScheme';
import listIOSDevices from '../../tools/listIOSDevices';

export interface FlagsT extends BuildFlags {
  configuration?: string;
  simulator?: string;
  device?: string | true;
  udid?: string;
  scheme?: string;
}

async function buildIOS(_: Array<string>, ctx: Config, args: FlagsT) {
  if (!ctx.project.ios) {
    throw new CLIError(
      'iOS project folder not found. Are you sure this is a React Native project?',
    );
  }

  const {xcodeProject, sourceDir} = ctx.project.ios;

  if (!xcodeProject) {
    throw new CLIError(
      `Could not find Xcode project files in "${sourceDir}" folder`,
    );
  }

  process.chdir(sourceDir);

  if (args.configuration) {
    logger.warn('--configuration has been deprecated. Use --mode instead.');
    logger.warn(
      'Parameters were automatically reassigned to --mode on this run.',
    );
    args.mode = args.configuration;
  }

  const projectInfo = getProjectInfo();

  if (args.mode) {
    checkIfConfigurationExists(projectInfo, args.mode);
  }

  const inferredSchemeName = path.basename(
    xcodeProject.name,
    path.extname(xcodeProject.name),
  );

  let scheme = args.scheme || inferredSchemeName;
  let mode = args.mode;

  if (args.interactive) {
    const selection = await selectFromInteractiveMode({scheme, mode});

    if (selection.scheme) {
      scheme = selection.scheme;
    }

    if (selection.mode) {
      mode = selection.mode;
    }
  }

  const modifiedArgs = {...args, scheme, mode};

  args.mode = getConfigurationScheme(
    {scheme: args.scheme, mode: args.mode},
    sourceDir,
  );

  logger.info(
    `Found Xcode ${
      xcodeProject.isWorkspace ? 'workspace' : 'project'
    } "${chalk.bold(xcodeProject.name)}"`,
  );

  const extendedArgs = {
    ...modifiedArgs,
    packager: false,
  };

  // // No need to load all available devices
  if (!args.device && !args.udid) {
    if (!args.simulator) {
      return buildProject(xcodeProject, undefined, scheme, extendedArgs);
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

    const selectedSimulator = getDestinationSimulator(args, fallbackSimulators);

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

  const devices = await listIOSDevices();

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

export const iosBuildOptions = [
  {
    name: '--simulator <string>',
    description:
      'Explicitly set simulator to use. Optionally include iOS version between ' +
      'parenthesis at the end to match an exact version: "iPhone 6 (10.0)"',
  },
  {
    name: '--mode <string>',
    description:
      'Explicitly set the scheme configuration to use. This option is case sensitive.',
  },
  {
    name: '--configuration <string>',
    description: '[Deprecated] Explicitly set the scheme configuration to use',
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
    default: getDefaultUserTerminal(),
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
  {
    name: '--extra-params <string>',
    description: 'Custom params that will be passed to xcodebuild command.',
    parse: (val: string) => val.split(' '),
  },
  {
    name: '--target <string>',
    description: 'Explicitly set Xcode target to use.',
  },
];

export default {
  name: 'build-ios',
  description: 'builds your app on iOS simulator',
  func: buildIOS,
  examples: [
    {
      desc: 'Build the app for the IOS simulator',
      cmd: 'react-native build-ios',
    },
    {
      desc: 'Build the app for all IOS devices',
      cmd: 'react-native build-ios --mode "Release"',
    },
    {
      desc: 'Build the app for a specific IOS device',
      cmd: 'react-native build-ios --simulator "IPhone 11"',
    },
  ],
  options: [
    ...iosBuildOptions,
    {
      name: '--interactive',
      description:
        'Explicitly select which scheme and configuration to use before running a build',
    },
  ],
};
