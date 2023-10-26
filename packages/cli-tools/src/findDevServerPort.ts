import handlePortUnavailable from './handlePortUnavailable';
import isPackagerRunning from './isPackagerRunning';
import {logAlreadyRunningBundler} from './port';

const findDevServerPort = async (
  initialPort: number,
  root: string,
): Promise<{
  port: number;
  startPackager: boolean;
}> => {
  let port = initialPort;
  let startPackager = false;

  const packagerStatus = await isPackagerRunning(port);

  if (
    typeof packagerStatus === 'object' &&
    packagerStatus.status === 'running'
  ) {
    if (packagerStatus.root === root) {
      startPackager = false;
      logAlreadyRunningBundler(port);
    } else {
      const result = await handlePortUnavailable(port, root);
      [port, startPackager] = [result.port, result.packager];
    }
  } else if (packagerStatus === 'unrecognized') {
    const result = await handlePortUnavailable(port, root);
    [port, startPackager] = [result.port, result.packager];
  }

  return {
    port,
    startPackager,
  };
};

export default findDevServerPort;
