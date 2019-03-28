// @flow
import fs from 'fs';
import path from 'path';
import {run, getTempDirectory, cleanup, writeFiles} from '../helpers';

const DIR = getTempDirectory('command-init');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('init --template fails without package name', () => {
  const {stderr} = run(DIR, [
    'init',
    '--template',
    'react-native-new-template',
  ]);
  expect(stderr).toContain('missing required argument');
});

test('init --template', () => {
  const templateFiles = [
    '.buckconfig',
    '.eslintrc.js',
    '.flowconfig',
    '.gitattributes',
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
  expect(stdout).toContain('Initializing new project from extrenal template');
  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toEqual(['TestInit']);
  expect(fs.readdirSync(path.join(DIR, 'TestInit'))).toEqual(templateFiles);

  const pkgJson = require(path.join(DIR, 'TestInit', 'package.json'));
  expect(pkgJson).toMatchSnapshot(
    'package.json contains necessary configuration',
  );
});
