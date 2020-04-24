import path from 'path';
import {
  runCLI,
  getTempDirectory,
  cleanup,
  writeFiles,
  spawnScript,
} from '../jest/helpers';

const cwd = getTempDirectory('test_root');

beforeAll(() => {
  // Register all packages to be linked
  for (const pkg of ['platform-ios', 'platform-android']) {
    spawnScript('yarn', ['link'], {
      cwd: path.join(__dirname, `../packages/${pkg}`),
    });
  }

  // Clean up folder and re-create a new project
  cleanup(cwd);
  writeFiles(cwd, {});

  // Initialise React Native project
  runCLI(cwd, ['init', 'TestProject']);

  // Link CLI to the project
  const pkgs = [
    '@react-native-community/cli-platform-ios',
    '@react-native-community/cli-platform-android',
  ];

  spawnScript('yarn', ['link', ...pkgs], {
    cwd: path.join(cwd, 'TestProject'),
  });
});

afterAll(() => {
  cleanup(cwd);
});

test('shows up current config without unnecessary output', () => {
  const {stdout} = runCLI(path.join(cwd, 'TestProject'), ['config']);
  expect(stdout).toMatchSnapshot();
});
