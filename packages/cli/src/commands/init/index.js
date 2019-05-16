// @flow
import init from './init';

export default {
  func: init,
  name: 'init <projectName>',
  description: 'initialize new React Native project',
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
    {
      name: '--directory [string]',
      description: 'Custom directory for your app',
    },
  ],
};
