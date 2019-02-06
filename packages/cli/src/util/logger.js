/**
 * @flow
 */
import chalk from 'chalk';

const SEPARATOR = ', ';
const TITLE = '[rn-cli]';

const joinMessages = (messages: Array<string>) => messages.join(SEPARATOR);

const getTimestamp = () => {
  const date = new Date();
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};

const getHeader = () => chalk.gray(`${getTimestamp()} ${TITLE}`);

const info = (...messages: Array<string>) => {
  console.log(
    `${getHeader()} ${chalk.cyan('INFO')} ${chalk.reset(
      joinMessages(messages)
    )}`
  );
};

const warn = (...messages: Array<string>) => {
  console.warn(
    `${getHeader()} ${chalk.yellow('WARN')} ${chalk.yellow(
      joinMessages(messages)
    )}`
  );
};

const error = (...messages: Array<string>) => {
  console.error(
    `${getHeader()} ${chalk.red('ERROR')} ${chalk.red(joinMessages(messages))}`
  );
};

const debug = (...messages: Array<string>) => {
  console.log(
    `${getHeader()} ${chalk.white('DEBUG')} ${joinMessages(messages)}`
  );
};

const log = (...messages: Array<string>) => {
  console.log(`${joinMessages(messages)}`);
};

module.exports = {
  info,
  warn,
  error,
  debug,
  log,
};
