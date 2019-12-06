/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {camelCase as toCamelCase} from 'lodash';
import {AndroidProjectParams} from '@react-native-community/cli-types';

export default function applyParams(
  str: string,
  params: AndroidProjectParams,
  prefix: string,
) {
  return str.replace(/\$\{(\w+)\}/g, (_pattern: string, param: string) => {
    const name = `${toCamelCase(prefix)}_${param}`;

    // @ts-ignore
    return params[param]
      ? `getResources().getString(R.string.${name})`
      : 'null';
  });
}
