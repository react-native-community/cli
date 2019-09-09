import ora from 'ora';
import {logger} from '@react-native-community/cli-tools';

class OraNoop implements ora.Ora {
  spinner: ora.Spinner = {interval: 1, frames: []};
  indent: number = 0;
  isSpinning: boolean = false;
  text: string = '';
  prefixText: string = '';
  color: ora.Color = 'blue';

  succeed(_text?: string | undefined) {
    return ora();
  }
  fail(_text?: string) {
    return ora();
  }
  start(_text?: string) {
    return ora();
  }
  stop() {
    return ora();
  }
  warn(_text?: string) {
    return ora();
  }
  info(_text?: string) {
    return ora();
  }
  stopAndPersist() {
    return ora();
  }
  clear() {
    return ora();
  }
  render() {
    return ora();
  }
  frame() {
    return ora();
  }
}

export function getLoader() {
  return logger.isVerbose() ? OraNoop : ora;
}

export const NoopLoader = OraNoop;
