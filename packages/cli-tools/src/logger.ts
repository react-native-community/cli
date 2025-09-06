import pico from 'picocolors';

const SEPARATOR = ', ';

let verbose = false;
let disabled = false;
let hidden = false;

const formatMessages = (messages: Array<string>) =>
  pico.reset(messages.join(SEPARATOR));

const success = (...messages: Array<string>) => {
  if (!disabled) {
    console.log(
      `${pico.green(pico.bold('success'))} ${formatMessages(messages)}`,
    );
  }
};

const info = (...messages: Array<string>) => {
  if (!disabled) {
    console.log(`${pico.cyan(pico.bold('info'))} ${formatMessages(messages)}`);
  }
};

const warn = (...messages: Array<string>) => {
  if (!disabled) {
    console.warn(
      `${pico.yellow(pico.bold('warn'))} ${formatMessages(messages)}`,
    );
  }
};

const error = (...messages: Array<string>) => {
  if (!disabled) {
    console.error(
      `${pico.red(pico.bold('error'))} ${formatMessages(messages)}`,
    );
  }
};

const debug = (...messages: Array<string>) => {
  if (verbose && !disabled) {
    console.log(`${pico.gray(pico.bold('debug'))} ${formatMessages(messages)}`);
  } else {
    hidden = true;
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

const hasDebugMessages = () => hidden;

export default {
  success,
  info,
  warn,
  error,
  debug,
  log,
  setVerbose,
  isVerbose,
  hasDebugMessages,
  disable,
  enable,
};
