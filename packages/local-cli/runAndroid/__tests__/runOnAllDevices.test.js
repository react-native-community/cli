/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

jest.mock('child_process', () => ({
  execFileSync: jest.fn(),
  spawnSync: jest.fn(),
}));

jest.mock('../getAdbPath');
const { execFileSync } = require('child_process');

const runOnAllDevices = require('../runOnAllDevices');

describe('--appFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses appFolder and default variant', () => {
    runOnAllDevices({
      appFolder: 'app',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('app:installDebug');
  });

  it('uses appFolder and variant', () => {
    runOnAllDevices({
      appFolder: 'app',
      variant: 'debug',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('app:installDebug');

    runOnAllDevices({
      appFolder: 'anotherApp',
      variant: 'staging',
    });

    expect(execFileSync.mock.calls[1][1]).toContain(
      'anotherApp:installStaging'
    );
  });

  it('uses appFolder and flavor', () => {
    runOnAllDevices({
      appFolder: 'app',
      flavor: 'someFlavor',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('app:installSomeFlavor');
  });

  it('uses appFolder and custom installDebug argument', () => {
    runOnAllDevices({
      appFolder: 'app',
      installDebug: 'someRandomCommand',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('app:someRandomCommand');
  });
});
