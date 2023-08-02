import {prompt} from './prompt';
import logger from './logger';
import chalk from 'chalk';

export const askForPortChange = async (port: number, nextPort: number) => {
  logger.info(
    `Metro is already running on port ${chalk.bold(port)} in another project.`,
  );
  return await prompt({
    name: 'change',
    type: 'select',
    message: `Use port ${nextPort} instead?`,
    choices: [
      {title: 'Yes', value: true},
      {title: 'No', value: false},
    ],
  });
};

export const logAlreadyRunningBundler = (port: number) => {
  logger.info(`Metro Bundler is already for this project on port ${port}.`);
};

export const logChangePortInstructions = (port: number) => {
  logger.info(
    `Please close the other packager running on port ${port}, or select another port with "--port".`,
  );
};
