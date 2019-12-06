import init from './init';

export default {
  func: init,
  detached: true,
  name: 'init <projectName>',
  description:
    'Initialize a new React Native project named <projectName> in a directory of the same name.',
  options: [
    {
      name: '--version [string]',
      description: 'Uses a valid semver version of React Native as a template',
    },
    {
      name: '--template [string]',
      description:
        'Uses a custom template. Valid arguments are: npm package, absolute directory prefixed with `file://`, Git repository or a tarball',
    },
    {
      name: '--npm',
      description: 'Forces using npm for initialization',
    },
    {
      name: '--directory [string]',
      description: 'Uses a custom directory instead of `<projectName>`.',
    },
    {
      name: '--title [string]',
      description: 'Uses a custom app title name for application',
    },
  ],
};
