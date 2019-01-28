/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import { valid as iosValid, pod } from './ios';
import { valid as androidValid } from './android';

const flat = {
  android: androidValid,
  ios: iosValid,
  Podfile: 'empty',
};

const nested = {
  android: {
    app: androidValid,
  },
  ios: iosValid,
};

const withExamples = {
  Examples: flat,
  ios: iosValid,
  android: androidValid,
};

const withPods = {
  Podfile: 'content',
  ios: pod,
};

export default { flat, nested, withExamples, withPods };
