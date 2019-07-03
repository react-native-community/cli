import chalk from 'chalk';

const SEPARATOR = ', ';

let verbose = false;
let disabled = false;

const formatMessages = (messages: Array<string>) =>
  chalk.reset(messages.join(SEPARATOR));

const success = (...messages: Array<string>) => {
  if (!disabled) {
    console.log(`${chalk.green.bold('success')} ${formatMessages(messages)}`);
  }
};

const info = (...messages: Array<string>) => {
  if (!disabled) {
    console.log(`${chalk.cyan.bold('info')} ${formatMessages(messages)}`);
  }
};

const warn = (...messages: Array<string>) => {
  if (!disabled) {
    console.warn(`${chalk.yellow.bold('warn')} ${formatMessages(messages)}`);
  }
};

const error = (...messages: Array<string>) => {
  if (!disabled) {
    console.error(`${chalk.red.bold('error')} ${formatMessages(messages)}`);
  }
};

const debug = (...messages: Array<string>) => {
  if (verbose && !disabled) {
    console.log(`${chalk.gray.bold('debug')} ${formatMessages(messages)}`);
  }
};

const log = (...messages: Array<string>) => {
  if (!disabled) {
    console.log(`${formatMessages(messages)}`);
  }
};

const setVerbose = (level: boolean) => {
  verbose = level;
};

const isVerbose = () => verbose;

const disable = () => {
  disabled = true;
};

const enable = () => {
  disabled = false;
};

export default {
  success,
  info,
  warn,
  error,
  debug,
  log,
  setVerbose,
  isVerbose,
  disable,
  enable,
};
