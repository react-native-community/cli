import isPackagerRunning from './isPackagerRunning';

type Result = {
  start: boolean;
  nextPort: number;
};

/**
 * Increases by one the port number until it finds an available port.
 * @param port Port number to start with.
 * @param root Root of the project.
 */

const getNextPort = async (port: number, root: string): Promise<Result> => {
  let nextPort = port + 1;
  let start = true;

  const result = await isPackagerRunning(nextPort);

  const isRunning = typeof result === 'object' && result.status === 'running';

  if (isRunning && result.root === root) {
    // Found running bundler for this project, so we do not need to start packager!
    start = false;
  } else if (isRunning || result === 'unrecognized') {
    return getNextPort(nextPort, root);
  }

  return {
    start,
    nextPort,
  };
};

export default getNextPort;
