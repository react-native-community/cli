import {
  spawnScript,
  getTempDirectory,
  cleanup,
  writeFiles,
} from '../jest/helpers';

const cwd = getTempDirectory('test_different_roots');

beforeEach(() => {
  cleanup(cwd);
  writeFiles(cwd, {});
});
afterEach(() => {
  cleanup(cwd);
});

test('works when Gradle is run outside of the project hierarchy', () => {
  const {stdout} = spawnScript('echo', ['hello world'], {cwd});
  expect(stdout).toMatchSnapshot();
});
