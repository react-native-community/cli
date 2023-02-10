import logger from './logger';
import chalk from 'chalk';

const printRunDoctorTip = () => {
  const linkToDocs =
    'https://github.com/react-native-community/cli/blob/main/docs/commands.md#doctor';

  logger.log('');
  logger.info(
    chalk.dim(
      `${chalk.dim(
        '💡 Tip: Make sure that you have set up your development environment correctly, by running',
      )} ${chalk.reset(chalk.bold('react-native doctor'))}. ${chalk.dim(
        `To read more about doctor command visit: ${linkToDocs} \n`,
      )}`,
    ),
  );
};

export default printRunDoctorTip;
