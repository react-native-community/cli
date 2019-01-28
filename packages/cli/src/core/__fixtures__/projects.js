/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import { valid, pod } from './ios';
import android from './android';

const flat = {
  android: android.valid,
  ios: valid,
  Podfile: 'empty',
};

const nested = {
  android: {
    app: android.valid,
  },
  ios: valid,
};

const withExamples = {
  Examples: flat,
  ios: valid,
  android: android.valid,
};

const withPods = {
  Podfile: 'content',
  ios: pod,
};

export default { flat, nested, withExamples, withPods };
