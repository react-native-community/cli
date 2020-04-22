import {spawn, spawnSync} from 'child_process';
import path from 'path';
import {IOSNativeModulesConfig} from '@react-native-community/cli-types';
import hasbin from 'hasbin';

const SCRIPT_PATH = path.resolve(__dirname, '../../../native_modules.rb');
const FIXTURES_ROOT = path.resolve(__dirname, '../__fixtures__/native_modules');

interface SerializedDependency {
  path: string;
}

interface SerializedTargetDefinition {
  name: string;
  abstract?: boolean;
  inheritance?: 'complete';
  platform: 'ios' | null;
  dependencies: Array<{[name: string]: SerializedDependency[]}> | null;
  podspecs: unknown | null;
  children?: SerializedTargetDefinition[];
  script_phases?: unknown[];
}

interface SerializedPodfile {
  target_definitions: SerializedTargetDefinition[];
}

interface RunInput {
  capture_stdout?: boolean;
  pods_activated_by_user?: string[];
  config: IOSNativeModulesConfig;
}

function run(runInput: RunInput) {
  return new Promise<SerializedTargetDefinition | string>((resolve, reject) => {
    const child = spawn('ruby', [SCRIPT_PATH]);
    child.stdin.write(JSON.stringify(runInput));
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
        if (runInput.capture_stdout) {
          resolve(data.trimRight());
        } else {
          const podfile: SerializedPodfile = JSON.parse(data);
          resolve(podfile.target_definitions[0]);
        }
      } else {
        reject(Buffer.concat(stderrData).toString());
      }
    });
  });
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
  let runInput: RunInput;

  beforeEach(() => {
    const iosDepPodspecPath = path.join(
      FIXTURES_ROOT,
      'node_modules/ios-dep/ios-dep.podspec',
    );
    runInput = {
      config: {
        project: {ios: {sourceDir: FIXTURES_ROOT}},
        dependencies: {
          'ios-dep': {
            root: path.join(FIXTURES_ROOT, 'node_modules/ios-dep'),
            platforms: {
              ios: {
                podspecPath: iosDepPodspecPath,
              },
              android: null,
            },
          },
          'android-dep': {
            root:
              '/root/app/node_modules/react-native-google-play-game-services',
            platforms: {ios: null, android: {}},
          },
        },
      },
    };
  });

  describe('concerning platform specificity', () => {
    beforeEach(() => {
      runInput.config.dependencies['macos-dep'] = {
        root: path.join(FIXTURES_ROOT, 'node_modules/macos-dep'),
        platforms: {
          ios: {
            podspecPath: path.join(
              FIXTURES_ROOT,
              'node_modules/macos-dep/macos-dep.podspec',
            ),
          },
          android: null,
        },
      };
      runInput.config.dependencies['ios-and-macos-dep'] = {
        root: path.join(FIXTURES_ROOT, 'node_modules/ios-and-macos-dep'),
        platforms: {
          ios: {
            podspecPath: path.join(
              FIXTURES_ROOT,
              'node_modules/ios-and-macos-dep/ios-and-macos-dep.podspec',
            ),
          },
          android: null,
        },
      };
    });

    it('only activates pods that support iOS in targets that target `ios`', () => {
      return run(runInput).then(
        (rootTargetDefinition: SerializedTargetDefinition) => {
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
        },
      );
    });

    it('only activates pods that support macOS in targets that target `osx`', () => {
      return run(runInput).then(
        (rootTargetDefinition: SerializedTargetDefinition) => {
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
        },
      );
    });
  });

  it('does not activate pods that were already activated previously (by the user in their Podfile)', () => {
    return run({
      pods_activated_by_user: ['ios-dep'],
      ...runInput,
    }).then(rootTargetDefinition => {
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
    return run({
      pods_activated_by_user: ['ios-dep/foo/bar'],
      ...runInput,
    }).then(rootTargetDefinition => {
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
      capture_stdout: true,
      ...runInput,
    }).then(stdout => {
      expect(stdout).toEqual('Detected React Native module pod for ios-dep');
    });
  });

  describe('concerning script_phases', () => {
    it('uses the options directly', () => {
      runInput.config.dependencies['ios-dep'].platforms.ios.scriptPhases = [
        {
          script: '123',
          name: 'My Name',
          execution_position: 'before_compile',
        },
      ];
      return run(runInput).then(
        (rootTargetDefinition: SerializedTargetDefinition) => {
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
        },
      );
    });

    it('reads a script file relative to the package root', () => {
      runInput.config.dependencies['ios-dep'].platforms.ios.scriptPhases = [
        {
          path: './some_shell_script.sh',
          name: 'My Name',
          execution_position: 'before_compile',
        },
      ];
      return run(runInput).then(
        (rootTargetDefinition: SerializedTargetDefinition) => {
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
        },
      );
    });
  });
});
