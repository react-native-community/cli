/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
export default {
  name: 'config',
  description: 'Print CLI configuration',
  func: async (_, ctx) => {
    console.log(JSON.stringify(ctx, null, 2));
  },
};
