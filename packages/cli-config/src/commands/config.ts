import {Config, DependencyConfig} from '@react-native-community/cli-types';

function isValidRNDependency(config: DependencyConfig) {
  return (
    Object.keys(config.platforms).filter((key) =>
      Boolean(config.platforms[key]),
    ).length !== 0
  );
}

function filterConfig(config: Config) {
  const filtered = {...config};
  const dependencies: Record<string, DependencyConfig> = {};
  Object.keys(filtered.dependencies).forEach((item) => {
    if (isValidRNDependency(filtered.dependencies[item])) {
      dependencies[item] = filtered.dependencies[item];
    }
  });
  return {...filtered, dependencies};
}

export default {
  name: 'config',
  description: 'Print CLI configuration',
  options: [
    {
      name: '--platform <platform>',
      description: 'Output configuration for a specific platform',
    },
  ],
  func: async (_argv: string[], ctx: Config) => {
    console.log(JSON.stringify(filterConfig(ctx), null, 2));
  },
};
