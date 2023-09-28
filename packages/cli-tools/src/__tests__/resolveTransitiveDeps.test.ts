import path from 'path';
import prompts from 'prompts';
import {cleanup, getTempDirectory, writeFiles} from '../../../../jest/helpers';
import {
  calculateWorkingVersion,
  filterInstalledPeers,
  filterNativeDependencies,
  findDependencyPath,
  getMissingPeerDepsForYarn,
  resolveTransitiveDeps,
} from '../resolveTransitiveDeps';
import logger from '../logger';
import findDependencies from '../../../cli-config/src/findDependencies';

jest.mock('execa', () => {
  return {sync: jest.fn()};
});

jest.mock('prompts', () => ({prompt: jest.fn()}));

jest.mock('../logger', () => ({
  isVerbose: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}));

const mockFetchJson = jest.fn();

jest.mock('npm-registry-fetch', () => ({
  json: mockFetchJson,
}));

const rootPackageJson = {
  name: 'App',
  version: '1.0.0',
  dependencies: {
    'react-native': '0.72.4',
    '@react-navigation/stack': '^6.3.17',
  },
};

const stackPackageJson = {
  name: '@react-navigation/stack',
  version: '6.3.17',
  dependencies: {
    '@react-navigation/elements': '^1.3.18',
    'react-native-gesture-handler': '^1.10.3',
  },
  peerDependencies: {
    react: '*',
    'react-native': '*',
    'react-native-gesture-handler': '>= 1.0.0',
  },
};

const elementsPackageJson = {
  name: '@react-navigation/elements',
  version: '1.3.18',
  peerDependencies: {
    react: '*',
    'react-native': '*',
    'react-native-safe-area-view': '*',
  },
};

const gestureHandlerPackageJson = {
  name: 'react-native-gesture-handler',
  version: '1.10.3',
};

const DIR = getTempDirectory('root_test');

const createTempFiles = (rest?: Record<string, string>) => {
  writeFiles(DIR, {
    'package.json': JSON.stringify(rootPackageJson),
    'node_modules/@react-navigation/stack/package.json': JSON.stringify(
      stackPackageJson,
    ),
    'node_modules/@react-navigation/elements/package.json': JSON.stringify(
      elementsPackageJson,
    ),
    'node_modules/react-native-gesture-handler/package.json': JSON.stringify(
      gestureHandlerPackageJson,
    ),
    'node_modules/react-native-gesture-handler/ios/Podfile': '',
    ...rest,
  });
};

beforeEach(async () => {
  await cleanup(DIR);
  jest.resetAllMocks();
});

describe('calculateWorkingVersion', () => {
  it('should return the highest matching version for all ranges', () => {
    const workingVersion = calculateWorkingVersion(
      ['*', '>=2.2.0', '>=2.0.0'],
      ['1.9.0', '2.0.0', '2.2.0', '3.0.0'],
    );

    expect(workingVersion).toBe('3.0.0');
  });

  it('should return null if no version matches all ranges', () => {
    const workingVersion = calculateWorkingVersion(
      ['*', '>=2.2.0', '^1.0.0-alpha'],
      ['1.9.0', '2.0.0', '2.1.0'],
    );

    expect(workingVersion).toBe(null);
  });
});

describe('findDependencyPath', () => {
  it('should return the path to the dependency if it is in top-level node_modules', () => {
    writeFiles(DIR, {
      'package.json': JSON.stringify(rootPackageJson),
      'node_modules/@react-navigation/stack/package.json': JSON.stringify(
        stackPackageJson,
      ),
    });

    const dependencyPath = findDependencyPath(
      '@react-navigation/stack',
      DIR,
      path.join(DIR, 'node_modules', '@react-navigation/stack'),
    );

    expect(dependencyPath).toBe(
      path.join(DIR, 'node_modules', '@react-navigation/stack'),
    );
  });

  it('should return the path to the nested node_modules if package is installed here', () => {
    writeFiles(DIR, {
      'package.json': JSON.stringify(rootPackageJson),
      'node_modules/@react-navigation/stack/node_modules/react-native-gesture-handler/package.json':
        '{}',
    });

    const dependencyPath = findDependencyPath(
      'react-native-gesture-handler',
      DIR,
      path.join(DIR, 'node_modules', '@react-navigation/stack'),
    );

    expect(dependencyPath).toBe(
      path.join(
        DIR,
        'node_modules',
        '@react-navigation/stack',
        'node_modules',
        'react-native-gesture-handler',
      ),
    );
  });
});

describe('filterNativeDependencies', () => {
  it('should return only dependencies with peer dependencies containing native code', () => {
    createTempFiles({
      'node_modules/react-native-safe-area-view/ios/Podfile': '{}',
    });
    const dependencies = findDependencies(DIR);
    const filtered = filterNativeDependencies(DIR, dependencies);
    expect(filtered.keys()).toContain('@react-navigation/stack');
    expect(filtered.keys()).toContain('@react-navigation/elements');
  });
});

describe('filterInstalledPeers', () => {
  it('should return only dependencies with peer dependencies that are installed', () => {
    createTempFiles();
    const dependencies = findDependencies(DIR);
    const libsWithNativeDeps = filterNativeDependencies(DIR, dependencies);
    const nonInstalledPeers = filterInstalledPeers(DIR, libsWithNativeDeps);

    expect(Object.keys(nonInstalledPeers)).toContain('@react-navigation/stack');
    expect(Object.keys(nonInstalledPeers['@react-navigation/stack'])).toContain(
      'react-native-gesture-handler',
    );
  });
});

describe('getMissingPeerDepsForYarn', () => {
  it('should return an array of peer dependencies to install', () => {
    createTempFiles();
    const dependencies = findDependencies(DIR);
    const missingDeps = getMissingPeerDepsForYarn(DIR, dependencies);
    expect(missingDeps.values()).toContain('react');
    expect(missingDeps.values()).toContain('react-native-gesture-handler');
    expect(missingDeps.values()).toContain('react-native-safe-area-view');
  });
});

describe('resolveTransitiveDeps', () => {
  it('should display list of missing peer dependencies if there are any', async () => {
    createTempFiles();
    prompts.prompt.mockReturnValue({});
    const dependencies = findDependencies(DIR);
    await resolveTransitiveDeps(DIR, dependencies);
    expect(logger.warn).toHaveBeenCalledWith(
      'Looks like you are missing some of the peer dependencies of your libraries:\n',
    );
  });

  it('should not display list if there are no missing peer dependencies', async () => {
    writeFiles(DIR, {
      'package.json': JSON.stringify(rootPackageJson),
    });
    const dependencies = findDependencies(DIR);
    await resolveTransitiveDeps(DIR, dependencies);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should prompt user to install missing peer dependencies', async () => {
    createTempFiles();
    prompts.prompt.mockReturnValue({});
    const dependencies = findDependencies(DIR);
    await resolveTransitiveDeps(DIR, dependencies);
    expect(prompts.prompt).toHaveBeenCalledWith({
      type: 'confirm',
      name: 'install',
      message:
        'Do you want to install them now? The matching versions will be added as project dependencies and become visible for autolinking.',
    });
  });

  it('should install missing peer dependencies if user confirms', async () => {
    createTempFiles();
    const dependencies = findDependencies(DIR);
    prompts.prompt.mockReturnValue({install: true});
    mockFetchJson.mockReturnValueOnce({
      versions: {
        '2.0.0': {},
        '2.1.0': {},
      },
    });

    const resolveDeps = await resolveTransitiveDeps(DIR, dependencies);

    expect(resolveDeps).toEqual(['react-native-gesture-handler@^2.1.0']);
  });
});
