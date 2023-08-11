import getNextPort from './getNextPort';
import {
  askForPortChange,
  logAlreadyRunningBundler,
  logChangePortInstructions,
} from './port';

const handlePortUnavailable = async (
  initialPort: number,
  projectRoot: string,
  initialPackager?: boolean,
): Promise<{
  port: number;
  packager: boolean;
}> => {
  const {nextPort, start} = await getNextPort(initialPort, projectRoot);
  let packager = initialPackager === true;
  let port = initialPort;

  if (!start) {
    packager = false;
    logAlreadyRunningBundler(nextPort);
  } else {
    const {change} = await askForPortChange(port, nextPort);

    if (change) {
      port = nextPort;
    } else {
      packager = false;
      logChangePortInstructions(port);
    }
  }

  return {
    port,
    packager,
  };
};

export default handlePortUnavailable;
