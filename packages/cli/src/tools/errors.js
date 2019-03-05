/**
 * @flow
 */
import chalk from 'chalk';

export class ProcessError extends Error {
  constructor(msg: string, processError: string) {
    super(`${chalk.red(msg)}\n\n${chalk.gray(processError)}`);
    Error.captureStackTrace(this, ProcessError);
  }
}
