import {isPackagerRunning, logger} from '@react-native-community/cli-tools';
import {startServerInNewWindow} from '../start/startServerInNewWindow';
import {Config} from '@react-native-community/cli-types';

interface Flags {
  port: number;
  terminal?: string;
}

export async function runPackager(
  _: Array<string>,
  config: Config,
  {port, terminal}: Flags,
) {
  const {root, reactNativePath} = config;
  const result = await isPackagerRunning(port);
  if (result === 'running') {
    logger.info('JS server already running.');
  } else if (result === 'unrecognized') {
    logger.warn('JS server not recognized, continuing with build...');
  } else if (result === 'not_running') {
    logger.info('Starting JS server...');

    try {
      startServerInNewWindow(port, root, reactNativePath, terminal);
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(
          `Failed to automatically start the packager server. Please run "react-native start" manually. Error details: ${error.message}`,
        );
      }
    }
  } else {
    logger.log('Unhandled request result: ', result);
  }
}
