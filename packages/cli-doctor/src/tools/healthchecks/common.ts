import chalk from 'chalk';
import readline from 'readline';
import wcwidth from 'wcwidth';
import stripAnsi from 'strip-ansi';
import {logger} from '@react-native-community/cli-tools';
import {Loader} from '../../types';

// Space is necessary to keep correct ordering on screen
const logMessage = (message?: string) => {
  const indentation = '   ';

  if (typeof message !== 'string') {
    logger.log();

    return;
  }

  const messageByLine = message.split('\n');

  return logger.log(`${indentation}${messageByLine.join(`\n${indentation}`)}`);
};

const addBlankLine = () => logMessage();

const logManualInstallation = ({
  healthcheck,
  url,
  command,
  message,
}: {
  healthcheck?: string;
  url?: string;
  command?: string;
  message?: string;
}) => {
  if (message) {
    return logMessage(message);
  }

  if (url) {
    logMessage(
      `Read more about how to download ${healthcheck} at ${chalk.dim.underline(
        url,
      )}`,
    );

    return;
  }

  if (command) {
    logMessage(
      `Please install ${healthcheck} by running ${chalk.bold(command)}`,
    );
  }
};

const logError = ({
  healthcheck,
  loader,
  error,
  message,
  command,
}: {
  healthcheck: string;
  loader?: Loader;
  error: Error;
  message?: string;
  command: string;
}) => {
  if (loader) {
    loader.fail();
  }

  addBlankLine();

  logMessage(chalk.dim(error.message));

  if (message) {
    logMessage(message);
    addBlankLine();

    return;
  }

  logMessage(
    `The error above occured while trying to install ${healthcheck}. Please try again manually: ${chalk.bold(
      command,
    )}`,
  );
  addBlankLine();
};

// Calculate the size of a message on terminal based on rows
function calculateMessageSize(message: string) {
  return Math.max(
    1,
    Math.ceil(wcwidth(stripAnsi(message)) / (process.stdout.columns || 80)),
  );
}

// Clear the message from the terminal
function removeMessage(message: string) {
  readline.moveCursor(process.stdout, 0, -calculateMessageSize(message));
  readline.clearScreenDown(process.stdout);
}

/**
 * Inline a series of Ruby statements:
 *
 * In:
 *  puts "a"
 *  puts "b"
 *
 * Out:
 *  puts "a"; puts "b";
 */
function inline(
  strings: TemplateStringsArray,
  ...values: {toString(): string}[]
) {
  const zipped = strings.map((str, i) => `${str}${values[i] ?? ''}`).join('');

  return zipped
    .trim()
    .split('\n')
    .filter((line) => !/^\W*$/.test(line))
    .map((line) => line.trim())
    .join('; ');
}

export {logMessage, logManualInstallation, logError, removeMessage, inline};
