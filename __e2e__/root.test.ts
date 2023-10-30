import path from 'path';

import {
  spawnScript,
  runCLI,
  getTempDirectory,
  cleanup,
  writeFiles,
} from '../jest/helpers';

const cwd = getTempDirectory('test_different_roots');

beforeAll(() => {
  // Register all packages to be linked
  for (const pkg of ['cli-platform-ios', 'cli-platform-android']) {
    spawnScript('yarn', ['link'], {
      cwd: path.join(__dirname, `../packages/${pkg}`),
    });
  }

  // Clean up folder and re-create a new project
  cleanup(cwd);
  writeFiles(cwd, {});

  // Initialise React Native project
  runCLI(cwd, ['init', 'TestProject', '--install-pods']);
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

  expect(stdout).toContain('BUILD SUCCESSFUL');
});
