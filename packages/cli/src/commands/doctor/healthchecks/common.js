// @flow
import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';

// Space is necessary to keep correct ordering on screen
const logMessage = message => logger.log(`   ${message}`);

const logManualInstallation = ({
  healthcheck = '',
  url,
  command,
  message,
}: {
  healthcheck?: string,
  url?: string,
  command?: string,
  message?: string,
}) => {
  if (message) {
    return logMessage(message);
  }

  if (url) {
    return logMessage(
      `Read more about how to download ${healthcheck} at ${chalk.dim(url)}`,
    );
  }

  if (command) {
    return logMessage(
      `Please install ${healthcheck} by running ${chalk.dim(command)}`,
    );
  }
};

export {logManualInstallation};
