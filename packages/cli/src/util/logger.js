/**
 * @flow
 */
import chalk from 'chalk';

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

module.exports = {
  info,
  warn,
  error,
  debug,
};
