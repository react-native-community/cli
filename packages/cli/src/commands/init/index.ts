import init from './init';

export default {
  func: init,
  detached: true,
  name: 'init <projectName>',
  description:
    'Initialize a new React Native project named <projectName> in a directory of the same name.',
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
  ],
};
