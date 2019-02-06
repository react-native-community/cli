/**
 * @flow
 */
import chalk from 'chalk';

const SEPARATOR = ', ';

const formatMessages = (messages: Array<string>) =>
  chalk.reset(messages.join(SEPARATOR));

const info = (...messages: Array<string>) => {
  console.log(`${chalk.cyan('info')} ${formatMessages(messages)}`);
};

const warn = (...messages: Array<string>) => {
  console.warn(`${chalk.yellow('warn')} ${formatMessages(messages)}`);
};

const error = (...messages: Array<string>) => {
  console.error(`${chalk.red('error')} ${formatMessages(messages)}`);
};

const debug = (...messages: Array<string>) => {
  console.log(`${chalk.gray('debug')} ${formatMessages(messages)}`);
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
