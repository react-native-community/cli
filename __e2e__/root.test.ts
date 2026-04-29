import path from 'path';
import fs from 'fs';
import {spawnSync} from 'child_process';

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

  // Execute `gradle` with `-p` flag and `cwd` outside of project hierarchy.
  // Use spawnSync directly to capture the raw status, signal, and error
  // instead of the masked exitCode returned by spawnScript.
  const result = spawnSync(gradleWrapper, ['-p', androidProjectRoot], {
    cwd: '/',
    env: process.env,
    encoding: 'utf8',
  });

  const stdout = result.stdout?.trim() ?? '';
  if (!stdout.includes('BUILD SUCCESSFUL')) {
    throw new Error(
      `Expected Gradle to succeed.\n` +
        `stdout: ${stdout}\n` +
        `stderr: ${result.stderr?.trim() ?? ''}\n` +
        `status: ${result.status}\n` +
        `signal: ${result.signal}\n` +
        `error: ${result.error?.message ?? 'none'}`,
    );
  }
});
