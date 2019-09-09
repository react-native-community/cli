/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Every file added to the project from another project is attached to
 * `PBXItemContainerProxy` through `PBXReferenceProxy`.
 */
export default function removeFromPbxReferenceProxySection(
  project: any,
  file: any,
) {
  const section = project.hash.project.objects.PBXReferenceProxy;

  for (const key of Object.keys(section)) {
    if (section[key].path === file.basename) {
      delete section[key];
    }
  }
}
