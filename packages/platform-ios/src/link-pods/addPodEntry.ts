/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {logger} from '@react-native-community/cli-tools';
import getPodspecName from '../config/getPodspecName';

export default function addPodEntry(
  podLines: Array<string>,
  linesToAddEntry:
    | Array<{line: number; indentation: number}>
    | {line: number; indentation: number}
    | null
    | undefined,
  podspecPath: string,
  nodeModulePath: string,
) {
  const podName = getPodspecName(podspecPath);
  const newEntry = `pod '${podName}', :path => '../node_modules/${nodeModulePath}'\n`;

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

function getLineToAdd(newEntry: string, indentation: number) {
  const spaces = Array(indentation + 1).join(' ');
  return spaces + newEntry;
}
