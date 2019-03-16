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

export class ReactNativeNotFound extends Error {
  constructor(err: Error) {
    super(
      `No package found. Are you sure this is a React Native project?
      \n${chalk.gray(err)}`,
    );
  }
}
