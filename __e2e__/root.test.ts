import path from 'path';
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
  // Find the gradle binary: prefer GRADLE_HOME (set by gradle/actions/setup-gradle),
  // fall back to whatever is on PATH.
  const gradleHome = process.env.GRADLE_HOME;
  const gradleBin = gradleHome
    ? path.join(gradleHome, 'bin', 'gradle')
    : 'gradle';

  // Create a minimal Gradle project with no Android plugin so the test does
  // not require a specific Android SDK installation.
  const minimalProjectDir = path.join(DIR, 'minimal-gradle');
  writeFiles(minimalProjectDir, {
    'settings.gradle': 'rootProject.name = "test"',
    'build.gradle': '// empty',
  });

  // Execute `gradle` with `-p` flag and `cwd` outside of project hierarchy.
  // Use spawnSync directly to capture raw status/signal/error.
  const result = spawnSync(gradleBin, ['-p', minimalProjectDir, 'help'], {
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
