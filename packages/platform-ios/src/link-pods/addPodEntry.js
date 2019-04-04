/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {logger} from '@react-native-community/cli-tools';

export default function addPodEntry(
  podLines,
  linesToAddEntry,
  podName,
  nodePath,
) {
  const newEntry = `pod '${podName}', :path => '../node_modules/${nodePath}'\n`;

  if (!linesToAddEntry) {
    return;
  }

  if (Array.isArray(linesToAddEntry)) {
    linesToAddEntry.map(({line, indentation}, idx) => {
      logger.debug(`Adding ${podName} to Pod file"`);
      podLines.splice(line + idx, 0, getLineToAdd(newEntry, indentation));
    });
  } else {
    const {line, indentation} = linesToAddEntry;
    logger.debug(`Adding ${podName} to Pod file"`);
    podLines.splice(line, 0, getLineToAdd(newEntry, indentation));
  }
}

function getLineToAdd(newEntry, indentation) {
  const spaces = Array(indentation + 1).join(' ');
  return spaces + newEntry;
}
