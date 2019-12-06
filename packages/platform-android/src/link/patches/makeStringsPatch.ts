/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {camelCase as toCamelCase} from 'lodash';
import {AndroidProjectParams} from '@react-native-community/cli-types';

export default function makeStringsPatch(
  params: AndroidProjectParams,
  prefix: string,
) {
  const values = Object.keys(params).map(param => {
    const name = `${toCamelCase(prefix)}_${param}`;
    return (
      '    ' +
      // @ts-ignore
      `<string moduleConfig="true" name="${name}">${params[param]}</string>`
    );
  });

  const patch = values.length > 0 ? `${values.join('\n')}\n` : '';

  return {
    pattern: '<resources>\n',
    patch,
  };
}
