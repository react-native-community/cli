import {runCLI, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('test_unknown');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('warn for passing in unknown commands', () => {
  const {exitCode, stderr} = runCLI(DIR, ['unknown'], {expectedFailure: true});
  expect(exitCode).toBe(1);
  expect(stderr).toContain("error: unknown command 'unknown'");
});

test('suggest matching command', () => {
  const {exitCode, stderr} = runCLI(DIR, ['ini'], {expectedFailure: true});
  expect(exitCode).toBe(1);
  expect(stderr).toContain(
    `error: unknown command 'ini'
(Did you mean init?)`,
  );
});
