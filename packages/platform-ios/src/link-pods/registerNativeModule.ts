/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import chalk from 'chalk';
import {CLIError} from '@react-native-community/cli-tools';
import {IOSProjectConfig} from '@react-native-community/cli-types';
import readPodfile from './readPodfile';
import findPodTargetLine from './findPodTargetLine';
import findLineToAddPod from './findLineToAddPod';
import findMarkedLinesInPodfile, {
  MARKER_TEXT,
} from './findMarkedLinesInPodfile';
import addPodEntry from './addPodEntry';
import savePodFile from './savePodFile';

export default function registerNativeModulePods(
  name: string,
  podspecPath: string,
  iOSProject: IOSProjectConfig,
) {
  const podLines = readPodfile(iOSProject.podfile);
  const linesToAddEntry = getLinesToAddEntry(podLines, iOSProject);
  addPodEntry(podLines, linesToAddEntry, podspecPath, name);
  savePodFile(iOSProject.podfile, podLines);
}

function getLinesToAddEntry(
  podLines: Array<string>,
  {projectName}: IOSProjectConfig,
) {
  const linesToAddPodWithMarker = findMarkedLinesInPodfile(podLines);
  if (linesToAddPodWithMarker.length > 0) {
    return linesToAddPodWithMarker;
  }
  const firstTargetLined = findPodTargetLine(podLines, projectName);
  if (firstTargetLined === null) {
    throw new CLIError(`
      We couldn't find a target to add a CocoaPods dependency.

      Make sure that you have a "${chalk.dim(
        `target '${projectName.replace('.xcodeproj', '')}' do`,
      )}" line in your Podfile.

      Alternatively, include "${chalk.dim(
        MARKER_TEXT,
      )}" in a Podfile where we should add
      linked dependencies.
    `);
  }
  return findLineToAddPod(podLines, firstTargetLined);
}
