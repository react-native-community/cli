import ora from 'ora';
import type {Ora, Options, Spinner, Color} from 'ora';
import logger from './logger';

export type Loader = Ora;

class OraNoop implements Loader {
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

export function getLoader(options?: string | Options | undefined): Loader {
  return logger.isVerbose() ? new OraNoop() : ora(options);
}

export const NoopLoader = OraNoop;
