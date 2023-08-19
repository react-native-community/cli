import logger from './logger';
import chalk from 'chalk';

const printRunDoctorTip = () => {
  const linkToDocs =
    'https://github.com/react-native-community/cli/blob/main/packages/cli-doctor/README.md#doctor';

  logger.log('');
  logger.info(
    chalk.dim(
      `${chalk.dim(
        '💡 Tip: Make sure that you have set up your development environment correctly, by running',
      )} ${chalk.reset(chalk.bold('npx react-native doctor'))}. ${chalk.dim(
        `To read more about doctor command visit: ${linkToDocs} \n`,
      )}`,
    ),
  );
};

export default printRunDoctorTip;
