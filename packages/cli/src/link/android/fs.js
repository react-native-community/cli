/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs-extra';

export const readFile = file => () => fs.readFileSync(file, 'utf8');

export const writeFile = (file, content) =>
  content
    ? fs.writeFileSync(file, content, 'utf8')
    : c => fs.writeFileSync(file, c, 'utf8');
