/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import readPodfile from './readPodfile';
import findPodTargetLine from './findPodTargetLine';
import findLineToAddPod from './findLineToAddPod';
import findMarkedLinesInPodfile from './findMarkedLinesInPodfile';
import addPodEntry from './addPodEntry';
import savePodFile from './savePodFile';

export default function registerNativeModulePods(
  name,
  dependencyConfig,
  iOSProject,
) {
  const podLines = readPodfile(iOSProject.podfile);
  const linesToAddEntry = getLinesToAddEntry(podLines, iOSProject);
  addPodEntry(podLines, linesToAddEntry, dependencyConfig.podspec, name);
  savePodFile(iOSProject.podfile, podLines);
}

function getLinesToAddEntry(podLines, {projectName}) {
  const linesToAddPodWithMarker = findMarkedLinesInPodfile(podLines);
  if (linesToAddPodWithMarker.length > 0) {
    return linesToAddPodWithMarker;
  }
  const firstTargetLined = findPodTargetLine(podLines, projectName);
  return findLineToAddPod(podLines, firstTargetLined);
}
