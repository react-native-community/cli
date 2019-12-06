/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import {Option} from 'commander';
import {camelCase} from 'lodash';
import {CommandOption} from '@react-native-community/cli-types';

type PassedOptions = {
  [key: string]: unknown;
};

// Commander.js has a 2 years old open issue to support <...> syntax
// for options. Until that gets merged, we run the checks manually
// https://github.com/tj/commander.js/issues/230
export default function assertRequiredOptions(
  options: CommandOption<any>[],
  passedOptions: PassedOptions,
) {
  options.forEach(opt => {
    const option = new Option(opt.name);

    if (!option.required) {
      return;
    }

    const name = camelCase(option.long);

    if (!passedOptions[name]) {
      // Provide commander.js like error message
      throw new Error(`Option "${option.long}" is missing`);
    }
  });
}
