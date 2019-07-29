/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import xml from 'xmldoc';

export default function readManifest(manifestPath: string) {
  return new xml.XmlDocument(fs.readFileSync(manifestPath, 'utf8'));
}
