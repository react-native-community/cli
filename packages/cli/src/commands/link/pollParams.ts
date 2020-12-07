/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prompts from 'prompts';

export default (questions: any[]) =>
  new Promise<Object>((resolve, reject) => {
    if (!questions) {
      resolve({});
      return;
    }

    prompts(questions).then(resolve, reject);
  });
