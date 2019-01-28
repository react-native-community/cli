/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import xml from 'xmldoc';

/**
 * @param  {String} manifestPath
 * @return {XMLDocument} Parsed manifest's content
 */
export default function readManifest(manifestPath) {
  return new xml.XmlDocument(fs.readFileSync(manifestPath, 'utf8'));
}
