/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Given xcodeproj it returns list of targets
 */
module.exports = function getTargets(project) {
  const {
    firstProject: { targets },
  } = project.getFirstProject();
  const nativeTargetSection = project.pbxNativeTargetSection();
  return targets.map(target => {
    const key = target.value;
    const configurationListId = project.pbxNativeTargetSection()[key]
      .buildConfigurationList;
    const configurationList = project.pbxXCConfigurationList()[
      configurationListId
    ];
    const buildConfigurationId = configurationList.buildConfigurations[0].value;
    const buildConfiguration = project.pbxXCBuildConfigurationSection()[
      buildConfigurationId
    ];
    return {
      uuid: key,
      target: nativeTargetSection[key],
      name: nativeTargetSection[key].productReference_comment,
      isTVOS:
        (buildConfiguration.buildSettings.SDKROOT &&
          buildConfiguration.buildSettings.SDKROOT.indexOf('appletv') !== -1) ||
        false,
    };
  });
};
