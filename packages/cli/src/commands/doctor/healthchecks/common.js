import logger from '@react-native-community/cli-tools/build/logger';
import chalk from 'chalk';

const logManualInstallation = ({healthcheck, url, command}) => {
  if (url) {
    // Space is necessary to keep correct ordering on screen
    return logger.log(
      `   Read more about how to download ${healthcheck} at ${chalk.dim(url)}.`,
    );
  }

  if (command) {
    // Space is necessary to keep correct ordering on screen
    return logger.log(
      `   Please install ${healthcheck} by running ${chalk.dim(command)}.`,
    );
  }
};

export {logManualInstallation};
