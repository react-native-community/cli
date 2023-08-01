import {execFileSync} from 'child_process';

/**
 * @param port The port to find the process id for
 * @returns The process id for the port or null if not found
 */

const getProcessIdFromPort = async (port: number): Promise<string | null> => {
  try {
    const result = execFileSync(
      'lsof',
      [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'],
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      },
    )
      .split('\n')[0]
      .trim();

    return result;
  } catch (error) {
    return null;
  }
};

export default getProcessIdFromPort;
