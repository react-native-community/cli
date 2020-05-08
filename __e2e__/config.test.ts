import path from 'path';
import fs from 'fs';
import {wrap} from 'jest-snapshot-serializer-raw';
import {
  runCLI,
  getTempDirectory,
  cleanupSync,
  writeFiles,
  spawnScript,
  replaceProjectRootInOutput,
} from '../jest/helpers';

const DIR = getTempDirectory('test_root');

function isValidJSON(text: string) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// We have to check whether setup_env script fails, if it does then we shouldn't log any info to the console
function createCorruptedSetupEnvScript() {
  const originalSetupEnvPath = path.join(
    __dirname,
    '../packages/cli/setup_env.sh',
  );
  const originalSetupEnv = fs.readFileSync(originalSetupEnvPath);
  const corruptedScript = '#!/bin/sh\n exit 1;';
  fs.writeFileSync(originalSetupEnvPath, corruptedScript);
  return () => {
    fs.writeFileSync(originalSetupEnvPath, originalSetupEnv);
  };
}

beforeAll(() => {
  // Register all packages to be linked
  for (const pkg of ['platform-ios', 'platform-android']) {
    spawnScript('yarn', ['link'], {
      cwd: path.join(__dirname, `../packages/${pkg}`),
    });
  }

  // Clean up folder and re-create a new project
  cleanupSync(DIR);
  writeFiles(DIR, {});

  // Initialise React Native project

  runCLI(DIR, ['init', 'TestProject']);

  // Link CLI to the project
  const pkgs = [
    '@react-native-community/cli-platform-ios',
    '@react-native-community/cli-platform-android',
  ];

  spawnScript('yarn', ['link', ...pkgs], {
    cwd: path.join(DIR, 'TestProject'),
  });
});

afterAll(() => {
  cleanupSync(DIR);
});

test('shows up current config without unnecessary output', () => {
  const {stdout} = runCLI(path.join(DIR, 'TestProject'), ['config']);
  const parsedStdout = JSON.parse(stdout);
  // Strip unnecessary parts
  parsedStdout.commands = parsedStdout.commands.map((command: any) => ({
    ...command,
    examples: command.examples && ['<<REPLACED>>'],
    options: command.options && ['<<REPLACED>>'],
  }));

  const configWithReplacedProjectRoots = replaceProjectRootInOutput(
    JSON.stringify(parsedStdout, null, 2).replace(/\\\\/g, '\\'),
    DIR,
  );
  expect(wrap(configWithReplacedProjectRoots)).toMatchSnapshot();
});

test('should log only valid JSON config if setting up env throws an error', () => {
  const restoreOriginalSetupEnvScript = createCorruptedSetupEnvScript();
  const {stdout, stderr} = runCLI(path.join(DIR, 'TestProject'), ['config']);

  restoreOriginalSetupEnvScript();
  expect(isValidJSON(stdout)).toBe(true);
  expect(stderr).toBe('');
});
