import {runCLI, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('test_default_behavior');

beforeEach(async () => {
  cleanup(DIR, false);
  writeFiles(DIR, {});
});
afterEach(async () => {
  cleanup(DIR, false);
});

test('shows up help information without passing in any args', () => {
  const {stdout} = runCLI(DIR);
  expect(stdout).toMatchSnapshot();
});
