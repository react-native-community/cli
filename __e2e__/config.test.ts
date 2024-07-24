import path from 'path';
import fs from 'fs';
import {wrap} from 'jest-snapshot-serializer-raw';
import {
  runCLI,
  getTempDirectory,
  cleanup,
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
  // Clean up folder and re-create a new project
  cleanup(DIR);
  writeFiles(DIR, {});

  // Initialise React Native project
  runCLI(DIR, ['init', 'TestProject', '--install-pods']);

  // Link CLI to the project
  spawnScript('yarn', ['link', __dirname, '--all'], {
    cwd: path.join(DIR, 'TestProject'),
  });
});

afterAll(() => {
  cleanup(DIR);
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

  const expectedXcodeProject =
    process.platform === 'darwin'
      ? {
          name: 'TestProject.xcworkspace',
          isWorkspace: true,
          path: '.',
        }
      : {
          name: 'TestProject.xcodeproj',
          isWorkspace: false,
          path: '.',
        };

  expect(parsedStdout.project.ios.xcodeProject).toStrictEqual(
    expectedXcodeProject,
  );

  delete parsedStdout.project.ios.xcodeProject;

  const configWithReplacedProjectRoots = replaceProjectRootInOutput(
    JSON.stringify(parsedStdout, null, 2).replace(/\\\\/g, '\\'),
    DIR,
  );
  expect(wrap(configWithReplacedProjectRoots)).toMatchSnapshot();
});

test('should log only valid JSON config if setting up env throws an error', () => {
  const restoreOriginalSetupEnvScript = createCorruptedSetupEnvScript();
  const {stdout, stderr} = runCLI(path.join(DIR, 'TestProject'), ['config']);

  const filteredStderr =
    process.platform === 'darwin'
      ? stderr
          .split('\n')
          .filter(
            (line) => !line.startsWith('warn Multiple Podfiles were found'),
          )
          .join('\n')
      : stderr;

  restoreOriginalSetupEnvScript();
  expect(isValidJSON(stdout)).toBe(true);
  expect(filteredStderr).toBe('');
});

const USER_CONFIG = `
module.exports = {
  commands: [
    {
      name: 'test-command',
      description: 'test command',
      func: () => {
        console.log('test-command');
      },
    },
  ],
};
`;

const USER_CONFIG_ESM = `
export default {
  commands: [
    {
      name: 'test-command-esm',
      description: 'test command',
      func: () => {
        console.log('test-command-esm');
      },
    },
  ],
};
`;

test('should read user config from react-native.config.js', () => {
  writeFiles(path.join(DIR, 'TestProject'), {
    'react-native.config.js': USER_CONFIG,
  });

  const {stdout} = runCLI(path.join(DIR, 'TestProject'), ['test-command']);
  expect(stdout).toBe('test-command');
});

test('should read user config from react-native.config.ts', () => {
  writeFiles(path.join(DIR, 'TestProject'), {
    'react-native.config.ts': USER_CONFIG,
  });

  const {stdout} = runCLI(path.join(DIR, 'TestProject'), ['test-command']);
  expect(stdout).toBe('test-command');
});

test('should read user config from react-native.config.mjs', () => {
  writeFiles(path.join(DIR, 'TestProject'), {
    'react-native.config.mjs': USER_CONFIG_ESM,
  });

  const {stdout} = runCLI(path.join(DIR, 'TestProject'), ['test-command-esm']);
  expect(stdout).toBe('test-command-esm');
});
