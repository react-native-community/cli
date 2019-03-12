// @flow
import init from './init';

export default {
  func: init,
  name: 'init <packageName>',
  description: 'initialize new project',
  options: [
    {
      command: '--rn-version [string]',
      description: 'version of RN',
    },
    {
      command: '--template [string]',
      description: 'custom template',
    },
  ],
};
