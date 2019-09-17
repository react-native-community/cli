import chalk from 'chalk';
import readline from 'readline';
import wcwidth from 'wcwidth';
import stripAnsi from 'strip-ansi';
import {logger} from '@react-native-community/cli-tools';

// Space is necessary to keep correct ordering on screen
const logMessage = (message: string) => logger.log(`   ${message}`);

const logManualInstallation = ({
  healthcheck = '',
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
    return logMessage(
      `Read more about how to download ${healthcheck} at ${chalk.dim.underline(
        url,
      )}`,
    );
  }

  if (command) {
    return logMessage(
      `Please install ${healthcheck} by running ${chalk.bold(command)}`,
    );
  }
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

export {logManualInstallation, removeMessage};
