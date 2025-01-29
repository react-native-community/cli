/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {IncomingMessage, ServerResponse} from 'http';

import {json} from 'body-parser';
import connect from 'connect';
import {launchEditor} from '@react-native-community/cli-tools';

type Options = {
  watchFolders: ReadonlyArray<string>;
};

/**
 * Open a stack frame in the user's text editor.
 */
export default function openStackFrameMiddleware(_: Options) {
  const handler = (
    req: IncomingMessage & {
      // Populated by body-parser
      body?: Object;
    },
    res: ServerResponse,
    next: (err?: Error) => void,
  ) => {
    if (req.method === 'POST') {
      if (req.body == null) {
        res.writeHead(400);
        res.end('Missing request body');
        return;
      }

      const frame = req.body as {
        file: string;
        lineNumber: number;
      };

      launchEditor(frame.file, frame.lineNumber);

      res.writeHead(200);
      res.end();
    }

    next();
  };

  return connect().use(json()).use(handler);
}
