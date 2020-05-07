import {runCLI, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('test_default_behavior');

beforeEach(async () => {
  await cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(async () => {
  await cleanup(DIR);
});

test('shows up help information without passing in any args', () => {
  const {stdout} = runCLI(DIR);
  expect(stdout).toMatchSnapshot();
});
