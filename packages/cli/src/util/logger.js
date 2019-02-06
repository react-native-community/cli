/**
 * @flow
 */
import chalk from 'chalk';

const SEPARATOR = ', ';

const formatMessages = (messages: Array<string>) =>
  chalk.reset(messages.join(SEPARATOR));

const info = (...messages: Array<string>) => {
  console.log(`${chalk.cyan.bold('info')} ${formatMessages(messages)}`);
};

const warn = (...messages: Array<string>) => {
  console.warn(`${chalk.yellow.bold('warn')} ${formatMessages(messages)}`);
};

const error = (...messages: Array<string>) => {
  console.error(`${chalk.red.bold('error')} ${formatMessages(messages)}`);
};

const debug = (...messages: Array<string>) => {
  console.log(`${chalk.gray.bold('debug')} ${formatMessages(messages)}`);
};

const log = (...messages: Array<string>) => {
  console.log(`${formatMessages(messages)}`);
};

module.exports = {
  info,
  warn,
  error,
  debug,
  log,
};
