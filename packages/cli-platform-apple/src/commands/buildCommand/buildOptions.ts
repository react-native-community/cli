import {BuilderCommand} from '../../types';
import {getPlatformInfo} from '../runCommand/getPlatformInfo';

export type BuildFlags = {
  mode?: string;
  target?: string;
  verbose?: boolean;
  scheme?: string;
  xcconfig?: string;
  buildFolder?: string;
  interactive?: boolean;
  destination?: string;
  extraParams?: string[];
  forcePods?: boolean;
};

export const getBuildOptions = ({platformName}: BuilderCommand) => {
  const {readableName} = getPlatformInfo(platformName);
  const isMac = platformName === 'macos';

  return [
    {
      name: '--mode <string>',
      description:
        'Explicitly set the scheme configuration to use. This option is case sensitive.',
    },
    {
      name: '--scheme <string>',
      description: 'Explicitly set Xcode scheme to use',
    },
    {
      name: '--destination <string>',
      description: 'Explicitly extend destination e.g. "arch=x86_64"',
    },
    {
      name: '--verbose',
      description: 'Do not use xcbeautify or xcpretty even if installed',
    },
    {
      name: '--xcconfig [string]',
      description: 'Explicitly set xcconfig to use',
    },
    {
      name: '--buildFolder <string>',
      description: `Location for ${readableName} build artifacts. Corresponds to Xcode's "-derivedDataPath".`,
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
    {
      name: '-i --interactive',
      description:
        'Explicitly select which scheme and configuration to use before running a build',
    },
    {
      name: '--force-pods',
      description: 'Force CocoaPods installation',
    },
    !isMac && {
      name: '--device [string]', // here we're intentionally using [] over <> to make passed value optional to allow users to run only on physical devices
      description:
        'Explicitly set the device to use by name or by unique device identifier . If the value is not provided,' +
        'the app will run on the first available physical device.',
    },
  ];
};
