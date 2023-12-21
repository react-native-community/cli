import {getDefaultUserTerminal} from '@react-native-community/cli-tools';
import {BuilderCommand} from '../../types';
import {getPlatformInfo} from './getPlatformInfo';
import {getBuildOptions} from '../buildCommand/buildOptions';

export const getRunOptions = ({platformName}: BuilderCommand) => {
  const {readableName} = getPlatformInfo(platformName);
  const isMac = platformName === 'macos';
  return [
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
      description: `List all available ${readableName} devices and simulators and let you choose one to run the app. `,
    },
    {
      name: '--udid <string>',
      description: 'Explicitly set the device to use by UDID',
    },
    !isMac && {
      name: '--simulator <string>',
      description:
        `Explicitly set the simulator to use. Optionally set the ${readableName} version ` +
        'between parentheses at the end to match an exact version: ' +
        '"iPhone 15 (17.0)"',
    },
    !isMac && {
      name: '--device <string>',
      description:
        'Explicitly set the device to use by name. The value is not required ' +
        'if you have a single device connected.',
    },
    ...getBuildOptions({platformName}),
  ];
};
