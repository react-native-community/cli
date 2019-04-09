/**
 * @flow
 */
import chalk from 'chalk';

const SEPARATOR = ', ';

let verbose = false;

const formatMessages = (messages: Array<string>) =>
  chalk.reset(messages.join(SEPARATOR));

const success = (...messages: Array<string>) => {
  console.log(`${chalk.green.bold('success')} ${formatMessages(messages)}`);
};

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
  if (verbose) {
    console.log(`${chalk.gray.bold('debug')} ${formatMessages(messages)}`);
  }
};

const log = (...messages: Array<string>) => {
  console.log(`${formatMessages(messages)}`);
};

const setVerbose = (level: boolean) => {
  verbose = level;
};

const isVerbose = () => verbose;

export default {
  success,
  info,
  warn,
  error,
  debug,
  log,
  setVerbose,
  isVerbose,
};
