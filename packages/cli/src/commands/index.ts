import {Command, DetachedCommand} from '@react-native-community/cli-types';
import {commands as metroCommands} from '@react-native-community/cli-plugin-metro';
import link from './link/link';
import unlink from './link/unlink';
import install from './install/install';
import uninstall from './install/uninstall';
import upgrade from './upgrade/upgrade';
import {commands as doctorCommands} from '@react-native-community/cli-doctor';
import config from './config/config';
import init from './init';
import profileHermes from '@react-native-community/cli-hermes';

export const projectCommands = [
  ...metroCommands,
  doctorCommands.info,
  link,
  unlink,
  install,
  uninstall,
  upgrade,
  config,
  profileHermes,
] as Command[];

export const detachedCommands = [
  init,
  doctorCommands.doctor,
] as DetachedCommand[];
