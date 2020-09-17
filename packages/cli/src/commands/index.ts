import {Command, DetachedCommand} from '@react-native-community/cli-types';
import start from './start/start';
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
import doctor from './doctor';
import profileHermes from '@react-native-community/cli-hermes';

export const projectCommands = [
  start,
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
  profileHermes,
] as Command[];

export const detachedCommands = [init, doctor] as DetachedCommand[];
