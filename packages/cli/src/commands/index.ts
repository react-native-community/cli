import {Command, DetachedCommand} from '@react-native-community/cli-types';
import {commands as cleanCommands} from '@react-native-community/cli-clean';
import {commands as doctorCommands} from '@react-native-community/cli-doctor';
import {commands as configCommands} from '@react-native-community/cli-config';
import profileHermes from '@react-native-community/cli-hermes';
import upgrade from './upgrade/upgrade';
import init from './init';

export const projectCommands = [
  ...configCommands,
  cleanCommands.clean,
  doctorCommands.info,
  upgrade,
  profileHermes,
] as Command[];

export const detachedCommands = [
  init,
  doctorCommands.doctor,
] as DetachedCommand[];
