/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getGroup from './getGroup';

const hasGroup = (
  pbxGroup: {children: Array<{comment: string}>},
  name: string,
) => pbxGroup.children.find(group => group.comment === name);

/**
 * Given project and path of the group, it deeply creates a given group
 * making all outer groups if necessary
 *
 * Returns newly created group
 */
export default function createGroup(project: any, path: string) {
  return path.split('/').reduce((group, name) => {
    if (!hasGroup(group, name)) {
      const uuid = project.pbxCreateGroup(name, '""');

      group.children.push({
        value: uuid,
        comment: name,
      });
    }

    return project.pbxGroupByName(name);
  }, getGroup(project));
}
