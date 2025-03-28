import {createSpinner} from 'nanospinner';
import type {Spinner} from 'nanospinner';
import logger from './logger';

export type Loader = Spinner;

type Options = Parameters<typeof createSpinner>[1];

class NanospinnerNoop implements Spinner {
  success() {
    return this;
  }
  error() {
    return this;
  }
  warn() {
    return this;
  }
  info() {
    return this;
  }
  stop() {
    return this;
  }
  start() {
    return this;
  }
  update() {
    return this;
  }
  reset() {
    return this;
  }
  clear() {
    return this;
  }
  spin() {
    return this;
  }
  write() {
    return this;
  }
  render() {
    return this;
  }
  loop() {
    return this;
  }
  isSpinning() {
    return false;
  }
}

export function getLoader(options?: Options): Loader {
  return logger.isVerbose()
    ? new NanospinnerNoop()
    : createSpinner('', options);
}

export const NoopLoader = NanospinnerNoop;
