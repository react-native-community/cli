/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import applyParams from './applyParams';
import {AndroidProjectParams} from '@react-native-community/cli-types';

export default function makePackagePatch(
  packageInstance: string,
  params: AndroidProjectParams,
  prefix: string,
) {
  const processedInstance = applyParams(packageInstance, params, prefix);

  return {
    pattern: 'new MainReactPackage()',
    patch: `,\n            ${processedInstance}`,
  };
}
