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

  spawnScript('pod', ['install'], {
    cwd: path.join(cwd, 'TestProject', 'ios'),
  });
});

afterAll(() => {
  cleanup(cwd);
});

test('`run-ios`', () => {
  const result = runCLI(path.join(cwd, 'TestProject'), [
    'run-ios',
    '--no-packager',
  ]);
  expect(result).toContain(
    'success Successfully launched the app on the simulator',
  );
});
