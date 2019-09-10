/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {prompt} from 'inquirer';
import {InquirerPrompt} from '@react-native-community/cli-types';

export default (questions: InquirerPrompt): Promise<any> =>
  new Promise<any>((resolve, reject) => {
    if (!questions) {
      resolve({});
      return;
    }

    prompt(questions).then(resolve, reject);
  });
