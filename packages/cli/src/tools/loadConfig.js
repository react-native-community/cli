/**
 * @flow
 */
import comsmiconfig from 'cosmiconfig';
import path from 'path';

import getPlatforms from './getPlatforms';

// @todo(mike): move this out to `tools`
import getProjectDependencies from '../commands/link/getProjectDependencies';

const explorer = comsmiconfig('react-native');

type Config = {
  root: string,
  reactNativePath: string,
};

type Options = {
  root: ?string,
  dependencies: boolean,
};

const defaultOptions = {
  root: process.cwd(),
  dependencies: false,
};

// todo make overrides with options
async function loadConfig(opts: Options = defaultOptions): Config {
  const {config} = (await explorer.search(opts.root)) || {config: {}};

  return {
    ...config,
    root: opts.root,
    reactNativePath: config.reactNativePath
      ? path.resolve(config.reactNativePath)
      : (() => {
          try {
            return path.dirname(
              // $FlowIssue: Wrong `require.resolve` type definition
              require.resolve('react-native/package.json', {
                paths: [opts.root],
              }),
            );
          } catch (_ignored) {
            throw new Error(
              'Unable to find React Native files. Make sure "react-native" module is installed in your project dependencies.',
            );
          }
        })(),
  };
}

export default loadConfig;
