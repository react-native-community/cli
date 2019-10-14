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

export const projectCommands = [
  server,
  bundle,
  ramBundle,
  upgrade,
  info,
  config,
  doctor,
] as Command[];

export const detachedCommands = [init] as DetachedCommand[];
