/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {camelCase as toCamelCase} from 'lodash';
import {ProjectParamsAndroid} from '../../types';

export default function applyParams(
  str: string,
  params: ProjectParamsAndroid,
  prefix: string,
) {
  return str.replace(/\$\{(\w+)\}/g, (_pattern: string, param: string) => {
    const name = `${toCamelCase(prefix)}_${param}`;

    // @ts-ignore
    return params[param] ? `getResources().getString(R.string.${name})` : '';
  });
}
