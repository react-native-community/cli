import {runCLI, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('test_unknown');

beforeEach(() => {
  cleanup(DIR, false);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR, false);
});

test('warn for passing in unknown commands', () => {
  const {stderr} = runCLI(DIR, ['unknown'], {expectedFailure: true});
  expect(stderr).toContain('error Unrecognized command "unknown".');
});

test('suggest matching command', () => {
  const {stderr} = runCLI(DIR, ['ini'], {expectedFailure: true});
  expect(stderr).toContain(
    'error Unrecognized command "ini". Did you mean "init"?',
  );
});
