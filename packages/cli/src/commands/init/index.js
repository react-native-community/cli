// @flow
import init from './init';

export default {
  func: init,
  name: 'init <projectName> [directory]',
  description:
    'Initialize a new React Native project named <projectName> in a directory of the same name or specified by an optional [directory] argument.',
  options: [
    {
      name: '--version [string]',
      description: 'Version of React Native',
    },
    {
      name: '--template [string]',
      description: 'Custom template',
    },
    {
      name: '--npm',
      description: 'Force use of npm during initialization',
    },
  ],
};
