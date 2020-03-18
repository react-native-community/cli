import path from 'path';

import {
  spawnScript,
  runCli,
  getTempDirectory,
  cleanup,
  writeFiles,
} from '../jest/helpers';

const cwd = getTempDirectory('test_different_roots');

// Register all packages to be linked
beforeAll(() => {
  for (const pkg of ['platform-ios', 'platform-android']) {
    spawnScript('yarn', ['link'], {
      cwd: path.join(__dirname, `../packages/${pkg}`),
    });
  }
});

beforeEach(() => {
  // Clean up folder and re-create a new project
  cleanup(cwd);
  writeFiles(cwd, {});

  // Initialise React Native project
  runCli(cwd, ['init', 'TestProject']);

  // Link CLI to the project
  for (const pkg of [
    '@react-native-community/cli-platform-ios',
    '@react-native-community/cli-platform-android',
  ]) {
    spawnScript('yarn', ['link', pkg], {
      cwd: path.join(cwd, 'TestProject'),
    });
  }
});

// afterEach(() => {
//   cleanup(cwd);
// });

test('works when Gradle is run outside of the project hierarchy', () => {
  /**
   * Location of Android project
   */
  const androidProjectRoot = path.join(cwd, 'TestProject/android');

  /*
   * Grab absolute path to Gradle wrapper. The fact that we are using
   * a wrapper from the project is just a convinience to avoid installing
   * Gradle globally
   */
  const gradleWrapper = path.join(androidProjectRoot, 'gradlew');

  // Execute `gradle` with `-p` flag and `cwd` outside of project hierarchy
  const {stdout} = spawnScript(gradleWrapper, ['-p', androidProjectRoot], {
    cwd: '/',
  });

  expect(stdout).toMatchSnapshot();
});
