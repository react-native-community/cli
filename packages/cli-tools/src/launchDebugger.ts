/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import launchDefaultBrowser from './launchDefaultBrowser';

async function launchDebugger(url: string) {
  return launchDefaultBrowser(url);
}

export default launchDebugger;
