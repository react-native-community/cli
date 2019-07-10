// @flow
import Ora from 'ora';
import logger from './logger';

class OraNoop {
  succeed() {}
  fail() {}
  start(message?: string) {}
  info(message?: string) {}
}

export function getLoader(): typeof Ora {
  return logger.isVerbose() ? OraNoop : Ora;
}

export const NoopLoader = OraNoop;
