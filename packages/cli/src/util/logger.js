/**
 * @flow
 */
import chalk from 'chalk';

// eslint-disable-next-line no-unused-vars
const noop = (...msgs: Array<string>) => {};

const shouldLogMessages = () => process.env.NODE_ENV !== 'test';

const LOGGER_STUB = {
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
};

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

const debug = (...messages: Array<string>) => {
  console.log(`${chalk.black.bgWhite(' DEBUG ')} ${joinMessages(messages)}`);
};

module.exports = shouldLogMessages()
  ? {
      info,
      warn,
      error,
      debug,
    }
  : LOGGER_STUB;
