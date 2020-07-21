import {
  runCLI,
  getTempDirectory,
  cleanupSync,
  writeFiles,
} from '../jest/helpers';

const DIR = getTempDirectory('test_unknown');

beforeEach(() => {
  cleanupSync(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanupSync(DIR);
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
