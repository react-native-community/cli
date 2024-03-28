import {XcodeProject} from 'xcode';
import getGroup, {findGroup} from './getGroup';

/**
 * Given project and path of the group, it deeply creates a given group
 * making all outer groups if necessary
 *
 * Returns newly created group
 */
function createGroup(project: XcodeProject, path: string) {
  return path.split('/').reduce((group, name) => {
    if (!findGroup(group, name)) {
      const uuid = project.pbxCreateGroup(name, '""');

      group &&
        group.children.push({
          value: uuid,
          comment: name,
        });
    }

    return project.pbxGroupByName(name);
  }, getGroup(project));
}

export default createGroup;
