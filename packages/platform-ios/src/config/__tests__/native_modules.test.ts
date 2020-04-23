import {spawn, spawnSync} from 'child_process';
import path from 'path';
import {IOSNativeModulesConfig} from '@react-native-community/cli-types';
import hasbin from 'hasbin';

const SCRIPT_PATH = path.resolve(__dirname, '../../../native_modules.rb');
const FIXTURES_ROOT = path.resolve(__dirname, '../__fixtures__/native_modules');

interface Dependency {
  path: string;
}

interface TargetDefinition {
  name: string;
  abstract?: boolean;
  inheritance?: 'complete';
  platform: 'ios' | null;
  dependencies: Array<{[name: string]: Dependency[]}> | null;
  podspecs: unknown | null;
  children?: TargetDefinition[];
  script_phases?: unknown[];
}

interface Podfile {
  target_definitions: TargetDefinition[];
}

interface RunConfig {
  captureStdout?: boolean;
  podsActivatedByUser?: string[];
  dependencyConfig: IOSNativeModulesConfig;
}

function run(runConfig: RunConfig) {
  return new Promise<TargetDefinition | string>((resolve, reject) => {
    const child = spawn('ruby', [SCRIPT_PATH]);
    child.stdin.write(JSON.stringify(runConfig));
    child.stdin.end();
    const stdoutData: Buffer[] = [];
    const stderrData: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutData.push(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderrData.push(chunk);
    });
    child.on('close', code => {
      if (code === 0) {
        const data = Buffer.concat(stdoutData).toString();
        if (runConfig.captureStdout) {
          resolve(data.trimRight());
        } else {
          const podfile: Podfile = JSON.parse(data);
          resolve(podfile.target_definitions[0]);
        }
      } else {
        reject(Buffer.concat(stderrData).toString());
      }
    });
  });
}

function addDependency(runConfig: RunConfig, dependencyName: string) {
  runConfig.dependencyConfig.dependencies[dependencyName] = {
    root: path.join(FIXTURES_ROOT, 'node_modules', dependencyName),
    platforms: {
      ios: {
        podspecPath: path.join(
          FIXTURES_ROOT,
          'node_modules',
          dependencyName,
          `${dependencyName}.podspec`,
        ),
      },
      android: null,
    },
  };
}

function describeIfSupportedEnv() {
  if (hasbin.sync('ruby')) {
    const result = spawnSync('ruby', ['-r', 'cocoapods', '-e', '']);
    if (result.status === 0) {
      return describe;
    }
  }
  console.warn(
    '[!] The `native_modules.rb` tests are disabled – ensure you have `ruby` ' +
      'and the `cocoapods` gem installed in order to run them.',
  );
  return describe.skip;
}

describeIfSupportedEnv()('native_modules.rb', () => {
  let runConfig: RunConfig;

  beforeEach(() => {
    runConfig = {
      dependencyConfig: {
        project: {ios: {sourceDir: FIXTURES_ROOT}},
        dependencies: {
          'android-dep': {
            root:
              '/root/app/node_modules/react-native-google-play-game-services',
            platforms: {ios: null, android: {}},
          },
        },
      },
    };
    addDependency(runConfig, 'ios-dep');
  });

  describe('concerning platform specificity', () => {
    beforeEach(() => {
      addDependency(runConfig, 'macos-dep');
      addDependency(runConfig, 'ios-and-macos-dep');
    });

    it('only activates pods that support iOS in targets that target `ios`', () => {
      return run(runConfig).then((rootTargetDefinition: TargetDefinition) => {
        expect(
          rootTargetDefinition.children.find(
            target => target.name === 'iOS Target',
          ).dependencies,
        ).toMatchInlineSnapshot(`
            Array [
              Object {
                "ios-dep": Array [
                  Object {
                    "path": "node_modules/ios-dep",
                  },
                ],
              },
              Object {
                "ios-and-macos-dep": Array [
                  Object {
                    "path": "node_modules/ios-and-macos-dep",
                  },
                ],
              },
            ]
          `);
      });
    });

    it('only activates pods that support macOS in targets that target `osx`', () => {
      return run(runConfig).then((rootTargetDefinition: TargetDefinition) => {
        expect(
          rootTargetDefinition.children.find(
            target => target.name === 'macOS Target',
          ).dependencies,
        ).toMatchInlineSnapshot(`
            Array [
              Object {
                "macos-dep": Array [
                  Object {
                    "path": "node_modules/macos-dep",
                  },
                ],
              },
              Object {
                "ios-and-macos-dep": Array [
                  Object {
                    "path": "node_modules/ios-and-macos-dep",
                  },
                ],
              },
            ]
          `);
      });
    });
  });

  it('does not activate pods that were already activated previously (by the user in their Podfile)', () => {
    runConfig.podsActivatedByUser = ['ios-dep'];
    return run(runConfig).then(rootTargetDefinition => {
      expect(rootTargetDefinition).toMatchInlineSnapshot(`
        Object {
          "abstract": true,
          "children": Array [
            Object {
              "dependencies": null,
              "inheritance": "complete",
              "name": "iOS Target",
              "platform": "ios",
              "podspecs": null,
            },
            Object {
              "name": "macOS Target",
              "platform": "osx",
            },
          ],
          "dependencies": Array [
            "ios-dep",
          ],
          "name": "Pods",
          "platform": null,
          "podspecs": null,
        }
      `);
    });
  });

  it('does not activate pods whose root spec were already activated previously (by the user in their Podfile)', () => {
    runConfig.podsActivatedByUser = ['ios-dep/foo/bar'];
    return run(runConfig).then(rootTargetDefinition => {
      expect(rootTargetDefinition).toMatchInlineSnapshot(`
        Object {
          "abstract": true,
          "children": Array [
            Object {
              "dependencies": null,
              "inheritance": "complete",
              "name": "iOS Target",
              "platform": "ios",
              "podspecs": null,
            },
            Object {
              "name": "macOS Target",
              "platform": "osx",
            },
          ],
          "dependencies": Array [
            "ios-dep/foo/bar",
          ],
          "name": "Pods",
          "platform": null,
          "podspecs": null,
        }
      `);
    });
  });

  // TODO: Add a second pod
  it('prints out the native module pods that were found', () => {
    return run({
      captureStdout: true,
      ...runConfig,
    }).then(stdout => {
      expect(stdout).toEqual('Detected React Native module pod for ios-dep');
    });
  });

  describe('concerning script_phases', () => {
    it('uses the options directly', () => {
      runConfig.dependencyConfig.dependencies[
        'ios-dep'
      ].platforms.ios.scriptPhases = [
        {
          script: '123',
          name: 'My Name',
          execution_position: 'before_compile',
        },
      ];
      return run(runConfig).then((rootTargetDefinition: TargetDefinition) => {
        expect(rootTargetDefinition.children[0].script_phases)
          .toMatchInlineSnapshot(`
            Array [
              Object {
                "execution_position": "before_compile",
                "name": "My Name",
                "script": "123",
              },
            ]
          `);
      });
    });

    it('reads a script file relative to the package root', () => {
      runConfig.dependencyConfig.dependencies[
        'ios-dep'
      ].platforms.ios.scriptPhases = [
        {
          path: './some_shell_script.sh',
          name: 'My Name',
          execution_position: 'before_compile',
        },
      ];
      return run(runConfig).then((rootTargetDefinition: TargetDefinition) => {
        expect(rootTargetDefinition.children[0].script_phases)
          .toMatchInlineSnapshot(`
            Array [
              Object {
                "execution_position": "before_compile",
                "name": "My Name",
                "script": "contents from some_shell_script.sh",
              },
            ]
          `);
      });
    });
  });
});
