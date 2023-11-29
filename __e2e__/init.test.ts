import fs from 'fs';
import path from 'path';
import {runCLI, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';
import slash from 'slash';

const DIR = getTempDirectory('command-init');
const PROJECT_NAME = 'TestInit';

function createCustomTemplateFiles() {
  writeFiles(DIR, {
    'custom/template/template.config.js': `module.exports = {
      placeholderName: 'HelloWorld',
      templateDir: './template-dir',
    };`,
    'custom/template/package.json':
      '{ "name": "template", "version": "0.0.1" }',
    'custom/template/template-dir/package.json': '{}',
    'custom/template/template-dir/file': '',
    'custom/template/template-dir/dir/file': '',
  });
}

const customTemplateCopiedFiles = [
  '.git',
  'dir',
  'file',
  'node_modules',
  'package.json',
  'react-native.config.js',
  'yarn.lock',
];

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

let templatePath = path.resolve(DIR, 'custom', 'template');
if (process.platform === 'win32') {
  templatePath = slash(templatePath);
} else {
  templatePath = `file://${templatePath}`;
}

test('init fails if the directory already exists', () => {
  fs.mkdirSync(path.join(DIR, PROJECT_NAME));

  const {stderr} = runCLI(DIR, ['init', PROJECT_NAME], {expectedFailure: true});
  expect(stderr).toContain(
    `error Cannot initialize new project because directory "${PROJECT_NAME}" already exists.`,
  );
});

test('init should prompt for the project name', () => {
  const {stdout} = runCLI(DIR, ['init']);

  expect(stdout).toContain('How would you like to name the app?');
});

test('init --template filepath', () => {
  createCustomTemplateFiles();

  const {stdout} = runCLI(DIR, [
    'init',
    '--template',
    templatePath,
    PROJECT_NAME,
    '--install-pods',
    'false',
  ]);

  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain('custom');

  let dirFiles = fs.readdirSync(path.join(DIR, PROJECT_NAME));

  expect(dirFiles).toEqual(customTemplateCopiedFiles);
});

test('init --template file with custom directory', () => {
  createCustomTemplateFiles();
  const customPath = 'custom-path';

  const {stdout} = runCLI(DIR, [
    'init',
    '--template',
    templatePath,
    PROJECT_NAME,
    '--directory',
    'custom-path',
    '--install-pods',
    'false',
  ]);

  // make sure --directory option is used in run instructions
  expect(stdout).toContain(customPath);

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain(customPath);

  let dirFiles = fs.readdirSync(path.join(DIR, customPath));
  expect(dirFiles).toEqual(customTemplateCopiedFiles);
});

test('init skips installation of dependencies with --skip-install', () => {
  createCustomTemplateFiles();

  const {stdout} = runCLI(DIR, [
    'init',
    '--template',
    templatePath,
    PROJECT_NAME,
    '--skip-install',
  ]);

  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain('custom');

  let dirFiles = fs.readdirSync(path.join(DIR, PROJECT_NAME));

  expect(dirFiles).toEqual(
    customTemplateCopiedFiles.filter(
      (file) => !['node_modules', 'yarn.lock'].includes(file),
    ),
  );
});

test('init uses npm as the package manager with --npm', () => {
  createCustomTemplateFiles();

  const {stdout} = runCLI(DIR, [
    'init',
    '--template',
    templatePath,
    PROJECT_NAME,
    '--npm',
    '--install-pods',
    'false',
  ]);

  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain('custom');

  const initDirPath = path.join(DIR, PROJECT_NAME);

  // Remove yarn.lock and node_modules
  const filteredFiles = customTemplateCopiedFiles.filter(
    (file) => !['yarn.lock', 'node_modules'].includes(file),
  );

  // Add package-lock.json
  const customTemplateCopiedFilesForNpm = [
    ...filteredFiles,
    'package-lock.json',
  ];

  // Assert for existence
  customTemplateCopiedFilesForNpm.forEach((file) => {
    expect(fs.existsSync(path.join(initDirPath, file))).toBe(true);
  });
});

test('init --platform-name should work for out of tree platform', () => {
  createCustomTemplateFiles();
  const outOfTreePlatformName = 'react-native-macos';

  const {stdout} = runCLI(DIR, [
    'init',
    PROJECT_NAME,
    '--platform-name',
    outOfTreePlatformName,
    '--skip-install',
    '--verbose',
  ]);

  expect(stdout).toContain('Run instructions');
  expect(stdout).toContain(
    `Installing template from ${outOfTreePlatformName}@latest`,
  );

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain('custom');

  let dirFiles = fs.readdirSync(path.join(DIR, PROJECT_NAME));

  expect(dirFiles.length).toBeGreaterThan(0);
});

test('should not create custom config file if installed version is below 0.73', () => {
  createCustomTemplateFiles();

  runCLI(DIR, ['init', PROJECT_NAME, '--skip-install', '--version', '0.72.0']);

  let dirFiles = fs.readdirSync(path.join(DIR, PROJECT_NAME));

  expect(dirFiles).not.toContain('react-native.config.js');
});

test('should create custom config file if installed version is latest (starting from 0.73)', () => {
  createCustomTemplateFiles();

  runCLI(DIR, ['init', PROJECT_NAME, '--skip-install']);

  let dirFiles = fs.readdirSync(path.join(DIR, PROJECT_NAME));

  expect(dirFiles).toContain('react-native.config.js');
  const fileContent = fs.readFileSync(
    path.join(DIR, PROJECT_NAME, 'react-native.config.js'),
    'utf8',
  );

  const configFileContent = `
  module.exports = {
    project: {
      ios: {
        automaticPodsInstallation: true
      }
    }
  }`;

  //normalize all white-spaces for easier comparision
  expect(fileContent.replace(/\s+/g, '')).toEqual(
    configFileContent.replace(/\s+/g, ''),
  );
});
