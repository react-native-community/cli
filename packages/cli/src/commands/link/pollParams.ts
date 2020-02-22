/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {prompt} from 'enquirer';

export default (questions: any[]) =>
  new Promise<Object>((resolve, reject) => {
    if (!questions) {
      resolve({});
      return;
    }

    prompt(questions).then(resolve, reject);
  });
