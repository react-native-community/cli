import {Command, DetachedCommand} from '@react-native-community/cli-types';
import {commands as doctorCommands} from '@react-native-community/cli-doctor';
import {commands as configCommands} from '@react-native-community/cli-config';
import {commands as metroCommands} from '@react-native-community/cli-plugin-metro';
import profileHermes from '@react-native-community/cli-hermes';
import link from './link/link';
import unlink from './link/unlink';
import install from './install/install';
import uninstall from './install/uninstall';
import upgrade from './upgrade/upgrade';
import init from './init';

export const projectCommands = [
  ...metroCommands,
  ...configCommands,
  doctorCommands.info,
  link,
  unlink,
  install,
  uninstall,
  upgrade,
  profileHermes,
] as Command[];

export const detachedCommands = [
  init,
  doctorCommands.doctor,
] as DetachedCommand[];
