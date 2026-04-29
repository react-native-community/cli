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
   * Location of Android project — we borrow its gradlew wrapper but test
   * the -p flag against a minimal project that has no Android SDK dependency.
   */
  const androidProjectRoot = path.join(DIR, 'TestProject/android');
  const gradleWrapper = path.join(androidProjectRoot, 'gradlew');

  if (!fs.existsSync(gradleWrapper)) {
    throw new Error(
      `gradlew not found at ${gradleWrapper} — react-native init may have failed`,
    );
  }

  // Ensure gradlew is executable — npm/yarn don't always preserve the execute
  // bit from the package tarball on Linux.
  fs.chmodSync(gradleWrapper, 0o755);

  // Create a minimal Gradle project with no Android plugin so the test does
  // not require a specific Android SDK installation.
  const minimalProjectDir = path.join(DIR, 'minimal-gradle');
  writeFiles(minimalProjectDir, {
    'settings.gradle': 'rootProject.name = "test"',
    'build.gradle': '// empty',
  });

  // Execute `gradle` with `-p` flag and `cwd` outside of project hierarchy.
  // The gradlew wrapper is taken from the Android project but the PROJECT
  // (settings/build files) is the minimal directory above, so no Android SDK
  // is needed.  Use spawnSync directly to capture raw status/signal/error.
  const result = spawnSync(gradleWrapper, ['-p', minimalProjectDir, 'help'], {
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
