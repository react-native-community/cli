/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import inquirer from 'inquirer';

export default (questions: any) =>
  new Promise<any>((resolve, reject) => {
    if (!questions) {
      resolve({});
      return;
    }

    inquirer.prompt(questions).then(resolve, reject);
  });
