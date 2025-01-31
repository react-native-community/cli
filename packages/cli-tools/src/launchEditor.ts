/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import launchEditorImpl from 'launch-editor';

export default function launchEditor(
  fileName: string,
  lineNumber: number,
  _watchFolders?: ReadonlyArray<string>,
): void {
  launchEditorImpl(`${fileName}:${lineNumber}`, process.env.REACT_EDITOR);
}
