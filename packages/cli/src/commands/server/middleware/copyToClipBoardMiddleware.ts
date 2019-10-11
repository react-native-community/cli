/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import http from 'http';
import copyToClipBoard from '../copyToClipBoard';
import {logger} from '@react-native-community/cli-tools';

/**
 * Handle the request from JS to copy contents onto host system clipboard.
 * This is only supported on Mac for now.
 */
export default function copyMiddleware(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: (err?: any) => void,
) {
  if (req.url === '/copy-to-clipboard') {
    // @ts-ignore Property 'rawBody' does not exist on type 'IncomingMessage'.
    const ret = copyToClipBoard(req.rawBody);
    if (!ret) {
      logger.warn('Copy button is not supported on this platform!');
    }
    res.end('OK');
  } else {
    next();
  }
}
