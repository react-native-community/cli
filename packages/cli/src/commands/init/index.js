// @flow
import init from './init';

export default {
  func: init,
  name: 'init <packageName>',
  description: 'initialize new React Native project',
  options: [
    {
      command: '--version [string]',
      description: 'Version of RN',
    },
    {
      command: '--template [string]',
      description: 'Custom template',
    },
    {
      command: '--npm',
      description: 'Force use of npm during initialization',
    },
  ],
};
