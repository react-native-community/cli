// @flow
import Ora from 'ora';
import logger from './logger';

class OraMock {
  succeed() {}
  fail() {}
  start() {}
}

function getLoader(): typeof Ora {
  return logger.isVerbose() ? OraMock : Ora;
}

export {getLoader};
