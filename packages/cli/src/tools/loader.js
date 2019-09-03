// @flow
import Ora from 'ora';
import logger from './logger';

class OraNoop {
  succeed(text?: string) {}
  fail(text?: string) {}
  start(text?: string) {}
  stop() {}
  warn(text?: string) {}
  info(text?: string) {}
  stopAndPersist() {}
  clear() {}
  render() {}
  frame() {}
}

export function getLoader(): typeof Ora {
  return logger.isVerbose() ? OraNoop : Ora;
}

export const NoopLoader = OraNoop;
