/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

test('builds a package when its checkout path contains glob characters', () => {
  const root = path.resolve(__dirname, '../..');
  const checkout = fs.mkdtempSync(path.join(root, 'build-(fixture)-'));

  try {
    const scripts = path.join(checkout, 'scripts');
    fs.mkdirSync(scripts);
    for (const file of ['build.js', 'helpers.js']) {
      fs.copyFileSync(
        path.join(root, 'scripts', file),
        path.join(scripts, file),
      );
    }
    fs.copyFileSync(
      path.join(root, 'babel.config.js'),
      path.join(checkout, 'babel.config.js'),
    );

    const pkg = path.join(checkout, 'packages', 'example');
    const src = path.join(pkg, 'src');
    fs.mkdirSync(src, {recursive: true});
    fs.writeFileSync(
      path.join(src, 'index.ts'),
      'export const value: number = 42;',
    );

    execFileSync(process.execPath, [path.join(scripts, 'build.js')], {
      cwd: checkout,
    });

    expect(
      fs.readFileSync(path.join(pkg, 'build', 'index.js'), 'utf8'),
    ).toContain('const value = 42;');
  } finally {
    fs.rmSync(checkout, {recursive: true, force: true});
  }
});
