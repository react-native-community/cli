import {
  runCLI,
  getTempDirectory,
  cleanupSync,
  writeFiles,
} from '../jest/helpers';

const DIR = getTempDirectory('test_default_behavior');

beforeEach(() => {
  cleanupSync(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanupSync(DIR);
});

test('shows up help information without passing in any args', () => {
  const {stderr} = runCLI(DIR);
  expect(stderr).toMatchSnapshot();
});
