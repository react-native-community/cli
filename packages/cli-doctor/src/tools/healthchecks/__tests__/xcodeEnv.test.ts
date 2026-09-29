import xcodeEnv from '../xcodeEnv';
import {NoopLoader} from '@react-native-community/cli-tools';
import {findPodfilePaths} from '@react-native-community/cli-platform-apple';
import fs from 'fs';

jest.mock('@react-native-community/cli-platform-apple', () => ({
  findPodfilePaths: jest.fn(),
}));

jest.mock('@react-native-community/cli-tools', () => {
  const actual = jest.requireActual('@react-native-community/cli-tools');
  return {
    ...actual,
    findProjectRoot: jest.fn(() => '/project'),
    resolveNodeModuleDir: jest.fn(
      () => '/project/node_modules/react-native/template/ios',
    ),
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  copyFile: jest.fn(),
}));

const config: any = {
  root: '/project',
  project: {ios: {sourceDir: '/project/ios'}},
};

describe('xcodeEnv healthcheck runAutomaticFix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  it('waits for every .xcode.env copy to finish before reporting success', async () => {
    (findPodfilePaths as jest.Mock).mockReturnValue([
      'Podfile',
      'nested/Podfile',
    ]);

    const completed: string[] = [];
    (fs.copyFile as unknown as jest.Mock).mockImplementation(
      (_src: string, dest: string, callback: (err: Error | null) => void) => {
        setTimeout(() => {
          completed.push(dest);
          callback(null);
        }, 10);
      },
    );

    const loader = new NoopLoader();
    const succeed = jest.spyOn(loader, 'succeed');

    await xcodeEnv.runAutomaticFix({loader, config} as any);

    // Both copies must have actually finished by the time the fix resolves.
    expect(completed).toHaveLength(2);
    expect(succeed).toHaveBeenCalled();
  });

  it('fails the loader when a copy rejects instead of reporting success', async () => {
    (findPodfilePaths as jest.Mock).mockReturnValue(['Podfile']);

    (fs.copyFile as unknown as jest.Mock).mockImplementation(
      (_src: string, _dest: string, callback: (err: Error | null) => void) => {
        setTimeout(() => callback(new Error('EACCES: permission denied')), 10);
      },
    );

    const loader = new NoopLoader();
    const succeed = jest.spyOn(loader, 'succeed');
    const fail = jest.spyOn(loader, 'fail');

    await xcodeEnv.runAutomaticFix({loader, config} as any);

    expect(fail).toHaveBeenCalled();
    expect(succeed).not.toHaveBeenCalled();
  });

  it('does not copy over an existing .xcode.env file', async () => {
    (findPodfilePaths as jest.Mock).mockReturnValue([
      'Podfile',
      'nested/Podfile',
    ]);
    (fs.existsSync as jest.Mock).mockImplementation((p: string) =>
      p.startsWith('/project/ios/nested'),
    );
    (fs.copyFile as unknown as jest.Mock).mockImplementation(
      (_src: string, _dest: string, callback: (err: Error | null) => void) =>
        callback(null),
    );

    const loader = new NoopLoader();
    await xcodeEnv.runAutomaticFix({loader, config} as any);

    expect(fs.copyFile).toHaveBeenCalledTimes(1);
    expect((fs.copyFile as unknown as jest.Mock).mock.calls[0][1]).toBe(
      '/project/ios/.xcode.env',
    );
  });
});
