// @flow
import init from './init';

export default {
  func: init,
  name: 'init <packageName>',
  description: 'initialize new React Native project',
  options: [
    {
      name: '--version [string]',
      description: 'Version of RN',
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
