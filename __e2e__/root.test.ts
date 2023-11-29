import path from 'path';

import {
  spawnScript,
  runCLI,
  getTempDirectory,
  cleanup,
  writeFiles,
  addRNCPrefix,
  getAllPackages,
} from '../jest/helpers';

const cwd = getTempDirectory('test_different_roots');

beforeAll(() => {
  const packages = getAllPackages();

  // Register all packages to be linked
  for (const pkg of packages) {
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

  spawnScript('yarn', ['link', ...addRNCPrefix(packages)], {
    cwd: path.join(cwd, 'TestProject'),
  });
});

afterAll(() => {
  cleanup(cwd);
});

test('works when Gradle is run outside of the project hierarchy', async () => {
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

  // // Make sure that we use `-bin` distribution of Gradle
  // await spawnScript(
  //   gradleWrapper,
  //   ['wrapper', '--gradle-version=8.0.1', '--distribution-type', 'bin'],
  //   {
  //     cwd: androidProjectRoot,
  //   },
  // );

  // Execute `gradle` with `-p` flag and `cwd` outside of project hierarchy
  const {stdout} = spawnScript(gradleWrapper, ['-p', androidProjectRoot], {
    cwd: '/',
  });

  expect(stdout).toContain('BUILD SUCCESSFUL');
});
