import {logger, prompt} from '@react-native-community/cli-tools';
import chalk from 'chalk';

const askForProcessKill = async (port: number) => {
  logger.info(
    `Metro is already running on port ${chalk.bold(port)} in another project.`,
  );

  return await prompt({
    name: 'change',
    type: 'select',
    message: 'Do you want to terminate this process?',
    choices: [
      {title: 'Yes', value: true},
      {title: 'No', value: false},
    ],
  });
};

export default askForProcessKill;
