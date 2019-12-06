import {Command, DetachedCommand} from '@react-native-community/cli-types';

// @ts-ignore - JS file
import server from './server/server';
import bundle from './bundle/bundle';
import ramBundle from './bundle/ramBundle';
import link from './link/link';
import unlink from './link/unlink';
import install from './install/install';
import uninstall from './install/uninstall';
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
  link,
  unlink,
  install,
  uninstall,
  upgrade,
  info,
  config,
  doctor,
] as Command[];

export const detachedCommands = [init] as DetachedCommand[];
