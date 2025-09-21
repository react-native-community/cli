import {runCLI, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('test_default_behavior');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('shows up help information without passing in any args', () => {
  const {stderr} = runCLI(DIR);
  expect(stderr.trim()).toMatchSnapshot();
});

test('does not pass --platform-name by default', () => {
  const {stderr} = runCLI(DIR);
  expect(stderr).not.toContain("unknown option '--platform-name'");
});
