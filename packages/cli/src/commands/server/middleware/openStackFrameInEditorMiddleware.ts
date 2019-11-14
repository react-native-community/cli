/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from 'http';
import launchEditor from '../launchEditor';

export default function getOpenStackFrameInEditorMiddleware({
  watchFolders,
}: {
  watchFolders: Array<string>;
}) {
  return (
    req: http.IncomingMessage & {rawBody: string},
    res: http.ServerResponse,
    next: (err?: any) => void,
  ) => {
    if (req.url === '/open-stack-frame') {
      const frame = JSON.parse(req.rawBody);
      launchEditor(frame.file, frame.lineNumber, watchFolders);
      res.end('OK');
    } else {
      next();
    }
  };
}
