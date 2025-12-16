import logger from './logger';
import pico from 'picocolors';

const printRunDoctorTip = () => {
  const linkToDocs =
    'https://github.com/react-native-community/cli/blob/main/packages/cli-doctor/README.md#doctor';

  logger.log('');
  logger.info(
    pico.dim(
      `${pico.dim(
        '💡 Tip: Make sure that you have set up your development environment correctly, by running',
      )} ${pico.reset(pico.bold('npx react-native doctor'))}. ${pico.dim(
        `To read more about doctor command visit: ${linkToDocs} \n`,
      )}`,
    ),
  );
};

export default printRunDoctorTip;
