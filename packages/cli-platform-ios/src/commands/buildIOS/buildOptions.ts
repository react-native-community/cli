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

export const buildOptions = [
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
  {
    name: '--interactive',
    description:
      'Explicitly select which scheme and configuration to use before running a build',
  },
];
