import path from 'path';

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
  runCLI(DIR, ['init', 'TestProject', `--install-pods`]);

  // Link CLI to the project
  console.log(__dirname);
  const filesOutput = spawnScript('ls', ['-la', path.dirname(__dirname)], {
    cwd: path.join(DIR, 'TestProject'),
  });
  console.log(filesOutput.stdout);

  const linkPackagesOutput = spawnScript('yarn', ['link-packages'], {
    cwd: path.dirname(__dirname),
  });
  console.log(linkPackagesOutput.stdout);

  const linkingOutput = spawnScript(
    'yarn',
    ['link', path.dirname(__dirname), '--all'],
    {
      cwd: path.join(DIR, 'TestProject'),
    },
  );
  console.log(linkingOutput.stdout);
});

afterAll(() => {
  cleanup(DIR);
});

test('works when Gradle is run outside of the project hierarchy', async () => {
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

  // Make sure that we use `-bin` distribution of Gradle
  await spawnScript(gradleWrapper, ['wrapper', '--distribution-type', 'bin'], {
    cwd: androidProjectRoot,
  });

  // Execute `gradle` with `-p` flag and `cwd` outside of project hierarchy
  const {stdout} = spawnScript(gradleWrapper, ['-p', androidProjectRoot], {
    cwd: '/',
  });

  expect(stdout).toContain('BUILD SUCCESSFUL');
});
