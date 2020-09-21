/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import fs from 'fs';
import xml from 'xmldoc';
import {CLIError} from '@react-native-community/cli-tools';

export default function readManifest(manifestPath: string) {
  try {
    return new xml.XmlDocument(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new CLIError(
      `Failed to parse Android Manifest file at ${manifestPath}`,
      error,
    );
  }
}
