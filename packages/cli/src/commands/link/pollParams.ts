/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-ignore untyped
import {prompt, QuestionCollection, Answers} from 'inquirer';

export default (questions: QuestionCollection) =>
  new Promise<Answers>((resolve, reject) => {
    if (!questions) {
      resolve({});
      return;
    }

    prompt(questions).then(resolve, reject);
  });
