import {PBXGroup, XcodeProject} from 'xcode';

function getFirstProject(project: XcodeProject) {
  return project.getFirstProject().firstProject;
}

function findGroup(group: PBXGroup | undefined, name: string) {
  return group?.children.find((g) => g.comment === name);
}

/**
 * Returns group from .xcodeproj if one exists, null otherwise
 *
 * Unlike node-xcode `pbxGroupByName` - it does not return `first-matching`
 * group if multiple groups with the same name exist
 *
 * If path is not provided, it returns top-level group
 */
function getGroup(project: XcodeProject, path?: string) {
  const firstProject = getFirstProject(project);

  let group = project.getPBXGroupByKey(firstProject.mainGroup);

  if (!path) {
    return group;
  }

  for (var name of path.split('/')) {
    var foundGroup = findGroup(group, name);

    if (foundGroup) {
      group = project.getPBXGroupByKey(foundGroup.value);
    } else {
      group = undefined;
      break;
    }
  }

  return group;
}

export default getGroup;
export {findGroup};
