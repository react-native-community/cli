// @flow
import fs from 'fs';
import path from 'path';
import execa from 'execa';
import {getTempDirectory, cleanup, writeFiles} from '../helpers';

const DIR = getTempDirectory('command-legacy-init');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('legacy init through react-native-cli', () => {
  const templateFiles = [
    '.buckconfig',
    '.flowconfig',
    '.gitattributes',
    '.gitignore',
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

  const {stdout} = execa.sync('npx', ['react-native-cli', 'init', 'TestApp'], {
    cwd: DIR,
  });

  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toEqual(['TestApp']);
  expect(fs.readdirSync(path.join(DIR, 'TestApp'))).toEqual(templateFiles);

  const pkgJson = require(path.join(DIR, 'TestApp', 'package.json'));
  expect(pkgJson).toMatchSnapshot(
    'package.json contains necessary configuration',
  );
});
