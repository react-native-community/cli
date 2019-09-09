/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default function findPodTargetLine(
  podLines: Array<string>,
  projectName: string,
) {
  const targetName = projectName.replace('.xcodeproj', '');
  // match first target definition in file: target 'target_name' do
  const targetRegex = new RegExp(`target ('|")${targetName}('|") do`, 'g');
  for (let i = 0, len = podLines.length; i < len; i++) {
    const match = podLines[i].match(targetRegex);
    if (match) {
      return i + 1;
    }
  }
  return null;
}
