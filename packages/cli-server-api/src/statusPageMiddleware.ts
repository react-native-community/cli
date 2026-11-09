/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from 'http';
import {normalizeProjectRoot} from '@react-native-community/cli-tools';

/**
 * Status page so that anyone who needs to can verify that the packager is
 * running on 8081 and not another program / service.
 */
export default function statusPageMiddleware(
  _req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  res.setHeader(
    'X-React-Native-Project-Root',
    normalizeProjectRoot(process.cwd()),
  );
  res.end('packager-status:running');
}
