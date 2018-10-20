/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Given an array of promise creators, executes them in a sequence.
 *
 * If any of the promises in the chain fails, all subsequent promises
 * will be skipped
 *
 * Returns the value last promise from a sequence resolved
 */
module.exports = function promiseWaterfall(tasks) {
  return tasks.reduce(
    (prevTaskPromise, task) => prevTaskPromise.then(task),
    Promise.resolve(),
  );
};
