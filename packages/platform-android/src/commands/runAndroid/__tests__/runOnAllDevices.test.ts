/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import runOnAllDevices from '../runOnAllDevices';
import execa from 'execa';

jest.mock('execa');
jest.mock('../getAdbPath');
jest.mock('../tryLaunchEmulator');

describe('--appFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses task "install[Variant]" as default task', async () => {
    // @ts-ignore
    await runOnAllDevices({
      variant: 'debug',
    });
    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'installDebug',
    );
  });

  it('uses appFolder and default variant', async () => {
    // @ts-ignore
    await runOnAllDevices({
      appFolder: 'someApp',
      variant: 'debug',
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'someApp:installDebug',
    );
  });

  it('uses appFolder and custom variant', async () => {
    // @ts-ignore
    await runOnAllDevices({
      appFolder: 'anotherApp',
      variant: 'staging',
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'anotherApp:installStaging',
    );
  });

  it('uses only task argument', async () => {
    // @ts-ignore
    await runOnAllDevices({
      tasks: ['someTask'],
      variant: 'debug',
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'someTask',
    );
  });

  it('uses appFolder and custom task argument', async () => {
    // @ts-ignore
    await runOnAllDevices({
      appFolder: 'anotherApp',
      tasks: ['someTask'],
      variant: 'debug',
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'anotherApp:someTask',
    );
  });

  it('uses multiple tasks', async () => {
    // @ts-ignore
    await runOnAllDevices({
      appFolder: 'app',
      tasks: ['clean', 'someTask'],
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'app:clean',
      // @ts-ignore
      'app:someTask',
    );
  });
});
