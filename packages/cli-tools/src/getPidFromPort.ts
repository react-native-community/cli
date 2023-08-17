import {execFileSync} from 'child_process';
import logger from './logger';

const getPID = (port: number): number | null => {
  try {
    const results = execFileSync(
      'lsof',
      [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'],
      {encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore']},
    )
      .split('\n')[0]
      .trim();
    const pid = Number(results);
    logger.debug(`Pid: ${pid} for port: ${port}`);
    return pid;
  } catch (error) {
    logger.debug(`No pid found for port: ${port}. Error: ${error}`);
    return null;
  }
};

export default getPID;
