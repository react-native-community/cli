// @flow
import fs from 'fs';
import path from 'path';
import {run, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('command-init');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('init --template fails without package name', () => {
  const {stderr} = run(
    DIR,
    ['init', '--template', 'react-native-new-template'],
    {expectedFailure: true},
  );
  expect(stderr).toContain('missing required argument');
});

test('init --template', () => {
  const templateFiles = [
    '.buckconfig',
    '.eslintrc.js',
    '.flowconfig',
    '.gitattributes',
    // should be here, but it's not published yet
    // '.gitignore',
    '.watchmanconfig',
    'App.js',
    '__tests__',
    'android',
    'babel.config.js',
    'index.js',
    'ios',
    'metro.config.js',
    'node_modules',
    'package.json',
    'yarn.lock',
  ];

  const {stdout} = run(DIR, [
    'init',
    '--template',
    'react-native-new-template',
    'TestInit',
  ]);

  expect(stdout).toContain('Welcome to React Native!');
  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toEqual(['TestInit']);
  expect(fs.readdirSync(path.join(DIR, 'TestInit'))).toEqual(templateFiles);

  const pkgJson = require(path.join(DIR, 'TestInit', 'package.json'));
  expect(pkgJson).toMatchSnapshot(
    'package.json contains necessary configuration',
  );
});

test('init --template file:/tmp/custom/template', () => {
  writeFiles(DIR, {
    'custom/template/template.config.js': `module.exports = {
      placeholderName: 'HelloWorld',
      templateDir: './template-dir',
    };`,
    'custom/template/package.json':
      '{ "name": "template", "version": "0.0.1" }',
    'custom/template/template-dir/package.json': '{}',
    'custom/template/template-dir/empty': '',
  });

  const {stdout} = run(DIR, [
    'init',
    '--template',
    `file://${path.resolve(DIR, 'custom', 'template')}`,
    'TestInit',
  ]);

  expect(stdout).toContain('Run instructions');
});
