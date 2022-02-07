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
  Object.keys(filtered.dependencies).forEach((item) => {
    if (!isValidRNDependency(filtered.dependencies[item])) {
      delete filtered.dependencies[item];
    }
  });
  return filtered;
}

export default {
  name: 'config',
  description: 'Print CLI configuration',
  func: async (_argv: string[], ctx: Config) => {
    console.log(JSON.stringify(filterConfig(ctx), null, 2));
  },
};
