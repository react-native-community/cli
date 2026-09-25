import {createSpinner, Spinner} from 'nanospinner';
import logger from './logger';

export type Loader = Spinner;

class NoopSpinner implements Loader {
  start() {
    return this;
  }
  stop() {
    return this;
  }
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
  clear() {
    return this;
  }
  render() {
    return this;
  }
  update() {
    return this;
  }
  reset() {
    return this;
  }
  spin() {
    return this;
  }
  write() {
    return this;
  }
  loop() {
    return this;
  }
  isSpinning() {
    return false;
  }
}

export function getLoader(options?: string | {text?: string}): Loader {
  const text = typeof options === 'string' ? options : options?.text;
  return logger.isVerbose() ? new NoopSpinner() : createSpinner(text);
}

export const NoopLoader = NoopSpinner;
