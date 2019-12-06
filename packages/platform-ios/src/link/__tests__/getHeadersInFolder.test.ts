/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getHeadersInFolder from '../getHeadersInFolder';

jest.mock('fs');
jest.mock('path');

const fs = require('fs');

const ROOT_DIR = '/';

describe('ios::getHeadersInFolder', () => {
  it('should return an array of all headers in given folder', () => {
    fs.__setMockFilesystem({
      'FileA.h': '',
      'FileB.h': '',
    });

    const foundHeaders = getHeadersInFolder(ROOT_DIR);

    expect(foundHeaders).toHaveLength(2);

    getHeadersInFolder(process.cwd()).forEach(headerPath => {
      expect(headerPath.includes(process.cwd())).toBe(true);
    });
  });

  it('should ignore all headers in Pods, Examples & node_modules', () => {
    fs.__setMockFilesystem({
      'FileA.h': '',
      'FileB.h': '',
      Pods: {
        'FileC.h': '',
      },
      Examples: {
        'FileD.h': '',
      },
      node_modules: {
        'FileE.h': '',
      },
    });

    expect(getHeadersInFolder(ROOT_DIR)).toHaveLength(2);
  });
});
