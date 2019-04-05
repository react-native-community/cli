// @flow
import Ora from 'ora';
import logger from './logger';

class OraMock {
  succeed() {}
  start() {}
}

function getLoader(): typeof Ora {
  return logger.isVerbose() ? OraMock : Ora;
}

export default getLoader;
