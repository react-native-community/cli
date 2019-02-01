/**
 * @flow
 */
const chalk = require('chalk');

class ProcessError extends Error {
  constructor(msg: string, processError: string) {
    super(`${chalk.red(msg)}\n\n${chalk.gray(processError)}`);
    Error.captureStackTrace(this, ProcessError);
  }
}

module.exports = {
  ProcessError,
};
