import {spawn} from 'child_process';
import path from 'path';
import {IOSNativeModulesConfig} from '@react-native-community/cli-types';

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
  ios: IOSNativeModulesConfig;
}

function run(config: RunInput) {
  return new Promise<SerializedTargetDefinition | string>((resolve, reject) => {
    const child = spawn('ruby', [SCRIPT_PATH]);
    child.stdin.write(JSON.stringify(config));
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
        if (config.capture_stdout) {
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

describe('native_modules.rb', () => {
  let config: RunInput;

  beforeEach(() => {
    const iosDepPodspecPath = path.join(
      FIXTURES_ROOT,
      'node_modules/ios-dep/ios-dep.podspec',
    );
    config = {
      ios: {
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

  it('activates iOS pods', () => {
    return run(config).then(rootTargetDefinition => {
      expect(rootTargetDefinition).toMatchInlineSnapshot(`
        Object {
          "abstract": true,
          "children": Array [
            Object {
              "dependencies": Array [
                Object {
                  "ios-dep": Array [
                    Object {
                      "path": "node_modules/ios-dep",
                    },
                  ],
                },
              ],
              "inheritance": "complete",
              "name": "ios",
              "platform": "ios",
              "podspecs": null,
            },
          ],
          "dependencies": null,
          "name": "Pods",
          "platform": null,
          "podspecs": null,
        }
      `);
    });
  });

  it('does not activate pods that were already activated previously (by the user in their Podfile)', () => {
    return run({
      pods_activated_by_user: ['ios-dep'],
      ...config,
    }).then(rootTargetDefinition => {
      expect(rootTargetDefinition).toMatchInlineSnapshot(`
          Object {
            "abstract": true,
            "children": Array [
              Object {
                "dependencies": null,
                "inheritance": "complete",
                "name": "ios",
                "platform": "ios",
                "podspecs": null,
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
      ...config,
    }).then(rootTargetDefinition => {
      expect(rootTargetDefinition).toMatchInlineSnapshot(`
          Object {
            "abstract": true,
            "children": Array [
              Object {
                "dependencies": null,
                "inheritance": "complete",
                "name": "ios",
                "platform": "ios",
                "podspecs": null,
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
      ...config,
    }).then(stdout => {
      expect(stdout).toEqual('Detected React Native module pod for ios-dep');
    });
  });

  describe('concerning script_phases', () => {
    it('uses the options directly', () => {
      config.ios.dependencies['ios-dep'].platforms.ios.scriptPhases = [
        {
          script: '123',
          name: 'My Name',
          execution_position: 'before_compile',
        },
      ];
      return run(config).then(
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
      config.ios.dependencies['ios-dep'].platforms.ios.scriptPhases = [
        {
          path: './some_shell_script.sh',
          name: 'My Name',
          execution_position: 'before_compile',
        },
      ];
      return run(config).then(
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
