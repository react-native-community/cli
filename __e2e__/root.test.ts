import path from 'path';
import {spawnSync} from 'child_process';

import {getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('test_different_roots');

function findGradleBin(): string | null {
  const gradleHome = process.env.GRADLE_HOME;
  const bin = gradleHome ? path.join(gradleHome, 'bin', 'gradle') : 'gradle';
  const probe = spawnSync(bin, ['--version'], {encoding: 'utf8', timeout: 10000});
  return probe.status === 0 ? bin : null;
}

const gradleBin = findGradleBin();
const testOrSkip = gradleBin ? test : test.skip;

beforeAll(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});

afterAll(() => {
  cleanup(DIR);
});

testOrSkip('works when Gradle is run outside of the project hierarchy', () => {
  const minimalProjectDir = path.join(DIR, 'minimal-gradle');
  writeFiles(minimalProjectDir, {
    'settings.gradle': 'rootProject.name = "test"',
    'build.gradle': '// empty',
  });

  const result = spawnSync(gradleBin!, ['-p', minimalProjectDir, 'help'], {
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
