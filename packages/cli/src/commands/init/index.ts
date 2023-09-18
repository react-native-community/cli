import init from './init';

export default {
  func: init,
  detached: true,
  name: 'init [projectName]',
  description:
    'New app will be initialized in the directory of the same name. Android and iOS projects will use this name for publishing setup.',
  options: [
    {
      name: '--version <string>',
      description: 'Shortcut for `--template react-native@version`',
    },
    {
      name: '--template <string>',
      description:
        'Uses a custom template. Valid arguments are the ones supported by `yarn add [package]` or `npm install [package]`, if you are using `--npm` option',
    },
    {
      name: '--npm',
      description: 'Forces using npm for initialization',
    },
    {
      name: '--pm <string>',
      description:
        'Use specific package manager to initialize the project. Available options: `yarn`, `npm`, `bun`. Default: `yarn`',
    },
    {
      name: '--directory <string>',
      description: 'Uses a custom directory instead of `<projectName>`.',
    },
    {
      name: '--title <string>',
      description: 'Uses a custom app title name for application',
    },
    {
      name: '--skip-install',
      description: 'Skips dependencies installation step',
    },
    {
      name: '--package-name <string>',
      description:
        'Inits a project with a custom package name (Android) and bundle ID (iOS), e.g. com.example.app',
    },
  ],
};
