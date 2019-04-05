/**
 * @flow
 */

import {type ConfigT} from './config/types.flow';

export type ContextT = ConfigT;

export type CommandT = {
  name: string,
  description?: string,
  usage?: string,
  func: (argv: Array<string>, ctx: ContextT, args: Object) => ?Promise<void>,
  options?: Array<{
    command: string,
    description?: string,
    parse?: (val: string) => any,
    default?: string | boolean | number,
  }>,
  examples?: Array<{
    desc: string,
    cmd: string,
  }>,
};
