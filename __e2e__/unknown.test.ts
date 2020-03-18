import {runCli, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('test_unknown');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('warn for passing in unknown commands', () => {
  const {stderr} = runCli(DIR, ['unknown'], {expectedFailure: true});
  expect(stderr).toContain('error Unrecognized command "unknown".');
});

test('suggest matching command', () => {
  const {stderr} = runCli(DIR, ['ini'], {expectedFailure: true});
  expect(stderr).toContain(
    'error Unrecognized command "ini". Did you mean "init"?',
  );
});
