/**
 * @flow
 */
import {type ConfigT} from 'types';

function isValidRNDependency(config) {
  return (
    Object.keys(config.platforms).filter(key => Boolean(config.platforms[key]))
      .length !== 0 ||
    Object.keys(config.hooks).length !== 0 ||
    config.assets.length !== 0 ||
    config.params.length !== 0
  );
}

function filterConfig(config) {
  const filtered = {...config};
  Object.keys(filtered.dependencies).forEach(item => {
    if (!isValidRNDependency(filtered.dependencies[item])) {
      delete filtered.dependencies[item];
    }
  });
  return filtered;
}

export default {
  name: 'config',
  description: 'Print CLI configuration',
  func: async (argv: string[], ctx: ConfigT) => {
    console.log(JSON.stringify(filterConfig(ctx), null, 2));
  },
};
