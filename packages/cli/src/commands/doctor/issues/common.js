import logger from '@react-native-community/cli-tools/build/logger';
import chalk from 'chalk';

const logManualInstallation = ({issue, url, command}) => {
  if (url) {
    // Space is necessary to keep correct ordering on screen
    return logger.log(`   Download ${issue} manually at ${chalk.dim(url)}.`);
  }

  if (command) {
    // Space is necessary to keep correct ordering on screen
    return logger.log(`   Install ${issue} by running ${chalk.dim(command)}.`);
  }
};

export {logManualInstallation};
