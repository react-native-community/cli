import fs from 'fs';
import path from 'path';
import {runCLI, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

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

// Files expected in the --dev-version tests
const devVersionFiles = [
  '.buckconfig',
  '.eslintrc.js',
  '.flowconfig',
  '.gitattributes',
  '.gitignore',
  '.prettierrc.js',
  '.watchmanconfig',
  'App.js',
  '__tests__',
  'android',
  'app.json',
  'babel.config.js',
  'index.js',
  'ios',
  'metro.config.js',
  'node_modules',
  'package.json',
  'yarn.lock',
];

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('init --template fails without package name', () => {
  const {stderr} = runCLI(
    DIR,
    ['init', '--template', 'react-native-new-template'],
    {expectedFailure: true},
  );
  expect(stderr).toContain('missing required argument');
});

test('init --template filepath', () => {
  createCustomTemplateFiles();
  let templatePath = path.resolve(DIR, 'custom', 'template');
  if (process.platform === 'win32') {
    templatePath = templatePath.split('\\').join('/');
  }

  const {stdout} = runCLI(DIR, [
    'init',
    '--template',
    `file://${templatePath}`,
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
  let templatePath = path.resolve(DIR, 'custom', 'template');
  if (process.platform === 'win32') {
    templatePath = templatePath.split('\\').join('/');
  }

  const {stdout} = runCLI(DIR, [
    'init',
    '--template',
    `file://${templatePath}`,
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
  let templatePath = path.resolve(DIR, 'custom', 'template');
  if (process.platform === 'win32') {
    templatePath = templatePath.split('\\').join('/');
  }

  const {stdout} = runCLI(DIR, [
    'init',
    '--template',
    `file://${templatePath}`,
    'TestInit',
    '--skip-install',
  ]);

  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain('custom');

  let dirFiles = fs.readdirSync(path.join(DIR, 'TestInit'));

  expect(dirFiles).toEqual(
    customTemplateCopiedFiles.filter(
      file => !['node_modules', 'yarn.lock'].includes(file),
    ),
  );
});

test('init --dev-version with Git commit', () => {
  const rnVersion = 'https://github.com/facebook/react-native#4118d79';
  const {stdout} = runCLI(DIR, [
    'init',
    '--dev-version',
    rnVersion,
    'TestInit',
  ]);

  expect(stdout).toContain('Run instructions');

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(DIR, 'TestInit', 'package.json'), 'utf8'),
  );

  // make sure that the version of `react-native` was properly updated
  expect(packageJson.dependencies['react-native']).toEqual(rnVersion);

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toEqual(['TestInit']);

  let dirFiles = fs.readdirSync(path.join(DIR, 'TestInit'));

  expect(dirFiles).toEqual(devVersionFiles);
});

test('init --dev-version with Git commit and --template filepath', () => {
  createCustomTemplateFiles();
  let templatePath = path.resolve(DIR, 'custom', 'template');
  if (process.platform === 'win32') {
    templatePath = templatePath.split('\\').join('/');
  }

  const rnVersion = 'https://github.com/facebook/react-native#4118d79';
  const {stdout} = runCLI(DIR, [
    'init',
    '--dev-version',
    rnVersion,
    '--template',
    `file://${templatePath}`,
    'TestInit',
  ]);

  expect(stdout).toContain('Run instructions');

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(DIR, 'TestInit', 'package.json'), 'utf8'),
  );

  // make sure that the version of `react-native` was properly updated
  expect(packageJson.dependencies['react-native']).toEqual(rnVersion);

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toContain('custom');

  let dirFiles = fs.readdirSync(path.join(DIR, 'TestInit'));

  expect(dirFiles).toEqual(customTemplateCopiedFiles);
});
