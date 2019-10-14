import fs from 'fs';
import path from 'path';
import copyFiles from '../copyFiles';
import {cleanup, getTempDirectory} from '../../../../../jest/helpers';
import replacePathSepForRegex from '../replacePathSepForRegex';

const DIR = getTempDirectory('copyFiles-test');

beforeEach(() => {
  cleanup(DIR);
  fs.mkdirSync(DIR);
});

afterEach(() => {
  cleanup(DIR);
});

test('copies text and binary files from source to destination', async () => {
  const src = path.resolve(__dirname, './__fixtures__');
  await copyFiles(src, DIR);

  expect(fs.readdirSync(DIR)).toMatchInlineSnapshot(`
    Array [
      "binary.keystore",
      "extraDir",
      "file1.js",
      "file2.txt",
    ]
  `);

  ['binary.keystore', 'file1.js', 'file2.txt'].forEach(file => {
    expect(fs.readFileSync(path.join(src, file))).toEqual(
      fs.readFileSync(path.join(DIR, file)),
    );
  });

  expect(fs.readdirSync(path.join(DIR, 'extraDir'))).toMatchInlineSnapshot(`
    Array [
      "file3",
    ]
  `);

  expect(fs.readFileSync(path.join(src, 'extraDir', 'file3'))).toEqual(
    fs.readFileSync(path.join(DIR, 'extraDir', 'file3')),
  );
});

test('copies files from source to destination excluding directory', async () => {
  const src = path.resolve(__dirname, './__fixtures__');
  let regexStr = path.join(src, 'extraDir');
  await copyFiles(src, DIR, {
    exclude: [new RegExp(replacePathSepForRegex(regexStr))],
  });
  expect(fs.readdirSync(DIR)).toMatchInlineSnapshot(`
    Array [
      "binary.keystore",
      "file1.js",
      "file2.txt",
    ]
  `);
});
