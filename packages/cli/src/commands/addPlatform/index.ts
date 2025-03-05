import addPlatform from './addPlatform';

export default {
  func: addPlatform,
  name: 'add-platform [packageName]',
  description: 'Add new platform to your React Native project.',
  options: [
    {
      name: '--version <string>',
      description: 'Pass version of the platform to be added to the project.',
    },
    {
      name: '--pm <string>',
      description:
        'Use specific package manager to initialize the project. Available options: `yarn`, `npm`, `bun`. Default: `yarn`',
      default: 'yarn',
    },
    {
      name: '--title <string>',
      description: 'Uses a custom app title name for application',
    },
  ],
};
