import {prompt} from './prompt';
import logger from './logger';

export const askForPortChange = async (port: number, nextPort: number) => {
  logger.info(`Another process is running on port ${port}.`);
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
  logger.info(
    `A dev server is already running for this project on port ${port}.`,
  );
};

export const logChangePortInstructions = () => {
  logger.info(
    'Please terminate this process and try again, or use another port with "--port".',
  );
};
