import {Command, DetachedCommand} from '@react-native-community/cli-types';
import {commands as cleanCommands} from '@react-native-community/cli-clean';
import {commands as doctorCommands} from '@react-native-community/cli-doctor';
import {commands as configCommands} from '@react-native-community/cli-config';
import init from './init';
import addPlatform from './addPlatform';

export const projectCommands = [
  ...configCommands,
  cleanCommands.clean,
  doctorCommands.info,
  addPlatform,
] as Command[];

export const detachedCommands = [
  init,
  doctorCommands.doctor,
] as DetachedCommand[];
