/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from 'http';
import {launchEditor} from '@react-native-community/cli-tools';
import connect from 'connect';
import rawBodyMiddleware from './rawBodyMiddleware';

type Options = {
  watchFolders: ReadonlyArray<string>;
};

function getOpenStackFrameInEditorMiddleware({watchFolders}: Options) {
  return (
    req: http.IncomingMessage & {rawBody?: string},
    res: http.ServerResponse,
    next: (err?: any) => void,
  ) => {
    if (!req.rawBody) {
      return next(new Error('missing request body'));
    }
    const frame = JSON.parse(req.rawBody);
    launchEditor(frame.file, frame.lineNumber, watchFolders);
    res.end('OK');
  };
}

export default (options: Options) => {
  return connect()
    .use(rawBodyMiddleware)
    .use(getOpenStackFrameInEditorMiddleware(options));
};
