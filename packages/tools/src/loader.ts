import ora from 'ora';
import type {Ora, Spinner, Color} from 'ora';
import logger from './logger';

export type Loader = Ora;

class OraNoop implements Ora {
  spinner: Spinner = {interval: 1, frames: []};
  indent: number = 0;
  isSpinning: boolean = false;
  text: string = '';
  prefixText: string = '';
  color: Color = 'blue';

  succeed(_text?: string | undefined) {
    return this;
  }
  fail(_text?: string) {
    return this;
  }
  start(_text?: string) {
    return this;
  }
  stop() {
    return this;
  }
  warn(_text?: string) {
    return this;
  }
  info(_text?: string) {
    return this;
  }
  stopAndPersist() {
    return this;
  }
  clear() {
    return this;
  }
  render() {
    return this;
  }
  frame() {
    return this.text;
  }
}

export function getLoader() {
  // FIXME refactor getLoader to not rely on class instantiation to avoid type conflict or implement an default Ora Loader Class definition
  return logger.isVerbose() ? OraNoop : (ora as any);
}

export const NoopLoader = OraNoop;
