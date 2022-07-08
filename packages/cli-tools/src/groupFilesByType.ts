/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {groupBy} from 'lodash';
import mime from 'mime';

/**
 * Given an array of files, it groups it by it's type.
 * Type of the file is inferred from it's mimetype based on the extension
 * file ends up with. The returned value is an object with properties that
 * correspond to the first part of the mimetype, e.g. images will be grouped
 * under `image` key since the mimetype for them is `image/jpg` etc.
 *
 * Example:
 * Given an array ['fonts/a.ttf', 'images/b.jpg'],
 * the returned object will be: {font: ['fonts/a.ttf'], image: ['images/b.jpg']}
 */
export default function groupFilesByType(assets: Array<string>) {
  return groupBy(assets, (type) => (mime.getType(type) || '').split('/')[0]);
}
