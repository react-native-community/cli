import fs from 'fs';
import path from 'path';
import {
  runCLI,
  getTempDirectory,
  cleanupSync,
  writeFiles,
} from '../jest/helpers';
import slash from 'slash';
import prompts from 'prompts';

jest.mock('prompts', () => jest.fn());

const DIR = getTempDirectory('command-init');

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
  'dir',
  'file',
  'node_modules',
  'package.json',
  'yarn.lock',
];

beforeEach(() => {
  cleanupSync(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanupSync(DIR);
});

let templatePath = path.resolve(DIR, 'custom', 'template');
if (process.platform === 'win32') {
  templatePath = slash(templatePath);
} else {
  templatePath = `file://${templatePath}`;
}

test('init fails if the directory already exists', () => {
  fs.mkdirSync(path.join(DIR, 'TestInit'));

  const {stderr} = runCLI(DIR, ['init', 'TestInit'], {expectedFailure: true});
  expect(stderr).toContain(
    'error Cannot initialize new project because directory "TestInit" already exists.',
  );
});

test('init should prompt for the project name', () => {
  createCustomTemplateFiles();
  const {stdout} = runCLI(DIR, ['init', 'test', '--template', templatePath]);

  (prompts as jest.MockedFunction<typeof prompts>).mockReturnValue(
    Promise.resolve({
      name: 'TestInit',
    }),
  );
  expect(stdout).toContain('Run instructions');
});

test('init --template filepath', () => {
  createCustomTemplateFiles();

  const {stdout} = runCLI(DIR, [
    'init',
    '--template',
    templatePath,
    'TestInit',
  ]);

  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain('custom');

  let dirFiles = fs.readdirSync(path.join(DIR, 'TestInit'));

  expect(dirFiles).toEqual(customTemplateCopiedFiles);
});

test('init --template file with custom directory', () => {
  createCustomTemplateFiles();
  const projectName = 'TestInit';
  const customPath = 'custom-path';

  const {stdout} = runCLI(DIR, [
    'init',
    '--template',
    templatePath,
    projectName,
    '--directory',
    'custom-path',
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
    'TestInit',
    '--skip-install',
  ]);

  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain('custom');

  let dirFiles = fs.readdirSync(path.join(DIR, 'TestInit'));

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
    'TestInit',
    '--npm',
  ]);

  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain('custom');

  const initDirPath = path.join(DIR, 'TestInit');

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
