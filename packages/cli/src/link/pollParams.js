/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import inquirer from 'inquirer';

module.exports = questions =>
  new Promise((resolve, reject) => {
    if (!questions) {
      resolve({});
      return;
    }

    inquirer.prompt(questions).then(resolve, reject);
  });
