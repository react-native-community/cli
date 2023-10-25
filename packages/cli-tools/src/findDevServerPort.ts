import handlePortUnavailable from './handlePortUnavailable';
import isPackagerRunning from './isPackagerRunning';
import {logAlreadyRunningBundler} from './port';

const findDevServerPort = async (
  port: number,
  root: string,
): Promise<{
  port: number;
  startPackager: boolean;
}> => {
  const packagerStatus = await isPackagerRunning(port);
  let startPackager = false;

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
