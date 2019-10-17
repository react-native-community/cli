import {Command, DetachedCommand} from '@react-native-community/cli-types';

// @ts-ignore - JS file
import server from './server/server';
import bundle from './bundle/bundle';
import ramBundle from './bundle/ramBundle';
import upgrade from './upgrade/upgrade';
import info from './info/info';
import config from './config/config';
import init from './init';
// @ts-ignore - JS file
import doctor from './doctor';
import {CLIError} from '@react-native-community/cli-tools';

const makeDeprecatedCommand = (name: string) => {
  return {
    name,
    func: () => {
      throw new CLIError(`
        This command has been removed in favor of "autolinking" with this React Native release.
        
        Check https://github.com/react-native-community/cli/blob/master/docs/autolinking.md
        for more details.

        If you still need to use "react-native ${name}" command, consider installing
        React Native CLI 3.x.
      `);
    },
  };
};

export const projectCommands = [
  server,
  bundle,
  ramBundle,
  upgrade,
  info,
  config,
  doctor,

  // Deprecated commands
  makeDeprecatedCommand('link'),
  makeDeprecatedCommand('unlink'),
  makeDeprecatedCommand('install'),
  makeDeprecatedCommand('uninstall'),
] as Command[];

export const detachedCommands = [init] as DetachedCommand[];
