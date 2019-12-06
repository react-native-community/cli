/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const getFirstProject = (project: any) =>
  project.getFirstProject().firstProject;

const findGroup = (
  groups: {children: Array<{comment: string; value: string}>},
  name: string,
) => groups.children.find(group => group.comment === name);

/**
 * Returns group from .xcodeproj if one exists, null otherwise
 *
 * Unlike node-xcode `pbxGroupByName` - it does not return `first-matching`
 * group if multiple groups with the same name exist
 *
 * If path is not provided, it returns top-level group
 */
export default function getGroup(project: any, path?: string) {
  const firstProject = getFirstProject(project);

  let groups = project.getPBXGroupByKey(firstProject.mainGroup);

  if (!path) {
    return groups;
  }

  for (const name of path.split('/')) {
    const foundGroup = findGroup(groups, name);

    if (foundGroup) {
      groups = project.getPBXGroupByKey(foundGroup.value);
    } else {
      groups = null;
      break;
    }
  }

  return groups;
}
