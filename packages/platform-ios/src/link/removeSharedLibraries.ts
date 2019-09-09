/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default function removeSharedLibraries(
  project: any,
  libraries: Array<string>,
) {
  if (!libraries.length) {
    return;
  }

  const target = project.getFirstTarget().uuid;

  for (const name of libraries) {
    project.removeFramework(name, {target});
  }
}
