/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import runOnAllDevices from '../runOnAllDevices';

jest.mock('child_process', () => ({
  execFileSync: jest.fn(),
  spawnSync: jest.fn(),
}));

jest.mock('../getAdbPath');
const {execFileSync} = require('child_process');

describe('--appFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses task "install[Variant]" as default task', () => {
    runOnAllDevices({
      variant: 'debug',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('installDebug');
  });

  it('uses appFolder and default variant', () => {
    runOnAllDevices({
      appFolder: 'someApp',
      variant: 'debug',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('someApp:installDebug');
  });

  it('uses appFolder and custom variant', () => {
    runOnAllDevices({
      appFolder: 'anotherApp',
      variant: 'staging',
    });

    expect(execFileSync.mock.calls[0][1]).toContain(
      'anotherApp:installStaging',
    );
  });

  it('uses only task argument', () => {
    runOnAllDevices({
      tasks: ['someTask'],
      variant: 'debug',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('someTask');
  });

  it('uses appFolder and custom task argument', () => {
    runOnAllDevices({
      appFolder: 'anotherApp',
      tasks: ['someTask'],
      variant: 'debug',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('anotherApp:someTask');
  });

  it('uses multiple tasks', () => {
    runOnAllDevices({
      appFolder: 'app',
      tasks: ['clean', 'someTask'],
    });

    expect(execFileSync.mock.calls[0][1]).toContain(
      'app:clean',
      'app:someTask',
    );
  });
});
