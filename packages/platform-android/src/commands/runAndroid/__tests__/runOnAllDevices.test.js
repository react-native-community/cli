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

  it('uses installDebug as default if no arguments', () => {
    runOnAllDevices({});

    expect(execFileSync.mock.calls[0][1]).toContain('installDebug');
  });

  it('uses appFolder and default variant', () => {
    runOnAllDevices({
      appFolder: 'someApp',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('someApp:installDebug');
  });

  it('uses appFolder and variant', () => {
    runOnAllDevices({
      appFolder: 'app',
      variant: 'debug',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('app:installDebug');

    runOnAllDevices({
      appFolder: 'anotherApp',
      variant: 'debug',
    });

    expect(execFileSync.mock.calls[1][1]).toContain('anotherApp:installDebug');

    runOnAllDevices({
      appFolder: 'anotherApp',
      variant: 'staging',
    });

    expect(execFileSync.mock.calls[2][1]).toContain(
      'anotherApp:installStaging',
    );
  });

  it('uses appFolder and flavor', () => {
    runOnAllDevices({
      appFolder: 'app',
      flavor: 'someFlavor',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('app:installSomeFlavor');
  });

  it('uses only installDebug argument', () => {
    runOnAllDevices({
      installDebug: 'someCommand',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('someCommand');
  });

  it('uses appFolder and custom installDebug argument', () => {
    runOnAllDevices({
      appFolder: 'anotherApp',
      installDebug: 'someCommand',
    });

    expect(execFileSync.mock.calls[0][1]).toContain('anotherApp:someCommand');
  });
});
