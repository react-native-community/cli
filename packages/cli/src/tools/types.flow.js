/**
 * @flow
 */

import {type ConfigT} from './config/types.flow';

export type ContextT = ConfigT;

export type LocalCommandT = {
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

type Package = {
  version: string,
  name: string,
};

/**
 * User can define command either as an object (RequiredCommandT) or
 * as an array of commands (Array<RequiredCommandT>).
 */
export type ProjectCommandT = LocalCommandT & {
  pkg: Package,
};

/**
 * Main type. Can be either local or a project command.
 */
export type CommandT = LocalCommandT | ProjectCommandT;
