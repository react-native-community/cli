/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import launchEditor from '../util/launchEditor';

module.exports = function getOpenStackFrameInEditorMiddleware({
  watchFolders,
}) {
  return (req, res, next) => {
    if (req.url === '/open-stack-frame') {
      const frame = JSON.parse(req.rawBody);
      launchEditor(frame.file, frame.lineNumber, watchFolders);
      res.end('OK');
    } else {
      next();
    }
  };
};
