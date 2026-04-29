import path from 'path';
import fs from 'fs';

import {
  spawnScript,
  runCLI,
  getTempDirectory,
  cleanup,
  writeFiles,
} from '../jest/helpers';

const DIR = getTempDirectory('test_different_roots');

beforeAll(() => {
  // Clean up folder and re-create a new project
  cleanup(DIR);
  writeFiles(DIR, {});

  // Initialise React Native project
  runCLI(DIR, ['init', 'TestProject', `--pm`, 'npm', `--install-pods`]);

  // Link CLI to the project
  const cliPath = path.resolve(__dirname, '../packages/cli');
  spawnScript('yarn', ['link'], {
    cwd: cliPath,
  });
  spawnScript('yarn', ['link', '@react-native-community/cli'], {
    cwd: path.join(DIR, 'TestProject'),
  });
});

afterAll(() => {
  cleanup(DIR);
});

test('works when Gradle is run outside of the project hierarchy', () => {
  /**
   * Location of Android project
   */
  const androidProjectRoot = path.join(DIR, 'TestProject/android');

  /*
   * Grab absolute path to Gradle wrapper. The fact that we are using
   * a wrapper from the project is just a convinience to avoid installing
   * Gradle globally
   */
  const gradleWrapper = path.join(androidProjectRoot, 'gradlew');

  if (!fs.existsSync(gradleWrapper)) {
    throw new Error(
      `gradlew not found at ${gradleWrapper} — react-native init may have failed`,
    );
  }

  // Ensure gradlew is executable — npm/yarn don't always preserve the execute
  // bit from the package tarball on Linux.
  fs.chmodSync(gradleWrapper, 0o755);

  // Execute `gradle` with `-p` flag and `cwd` outside of project hierarchy
  const result = spawnScript(gradleWrapper, ['-p', androidProjectRoot], {
    cwd: '/',
  });

  if (!result.stdout.includes('BUILD SUCCESSFUL')) {
    throw new Error(
      `Expected Gradle to succeed.\nstdout: ${result.stdout}\nstderr: ${result.stderr}\nexitCode: ${result.exitCode}`,
    );
  }
});
