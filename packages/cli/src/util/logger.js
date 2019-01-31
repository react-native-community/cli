// @flow
const chalk = require('chalk');

const SEPARATOR = ', ';

const joinMessages = (messages: Array<string>) => messages.join(SEPARATOR);

const info = (...messages: Array<string>) => {
  console.log(
    `${chalk.black.bgCyan(' INFO ')} ${chalk.reset(joinMessages(messages))}`
  );
};

const warn = (...messages: Array<string>) => {
  console.warn(
    `${chalk.black.bgYellow(' WARN ')} ${chalk.yellow(joinMessages(messages))}`
  );
};

const error = (...messages: Array<string>) => {
  console.error(
    `${chalk.black.bgRed(' ERROR ')} ${chalk.red(joinMessages(messages))}`
  );
};

const logError = (err: Error) => {
  console.error(`${chalk.black.bgRed(' ERROR ')} ${chalk.red(err.message)} \n`);
  if (err instanceof ProcessError) {
    console.error(`${chalk.grey(err.processError)}`);
  }
};

const debug = (...messages: Array<string>) => {
  console.log(`${chalk.black.bgWhite(' DEBUG ')} ${joinMessages(messages)}`);
};

class ProcessError extends Error {
  constructor(msg: string, processError: string) {
    super(msg);
    this.processError = processError;
    Error.captureStackTrace(this, ProcessError);
  }

  processError: string;
}

module.exports = {
  info,
  warn,
  error,
  debug,
  logError,
  ProcessError,
};
