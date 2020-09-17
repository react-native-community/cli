import {spawn, spawnSync} from 'child_process';
import path from 'path';
import {IOSNativeModulesConfig} from '@react-native-community/cli-types';
import hasbin from 'hasbin';

const SCRIPT_PATH = path.resolve(__dirname, '../../../native_modules.rb');
const FIXTURES_ROOT = path.resolve(__dirname, '../__fixtures__/native_modules');
const REACT_NATIVE_ROOT = '/root/app/node_modules/react-native';

interface Dependency {
  path: string;
}

interface NativeModulesReturnValue {
  reactNativePath: string;
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

interface TestScriptOutput {
  target_definitions: TargetDefinition[];
  return_values: NativeModulesReturnValue[];
}

interface RunConfig {
  captureStdout?: boolean;
  podsActivatedByUser?: string[];
  dependencyConfig: IOSNativeModulesConfig;
}

interface RunResult {
  rootTargetDefinition: TargetDefinition;
  returnValues: NativeModulesReturnValue[];
}

function run(runConfig: RunConfig) {
  return new Promise<RunResult | string>((resolve, reject) => {
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
    child.on('close', (code) => {
      if (code === 0) {
        const data = Buffer.concat(stdoutData).toString();
        if (runConfig.captureStdout) {
          resolve(data.trimRight());
        } else {
          const {
            target_definitions,
            return_values,
          }: TestScriptOutput = JSON.parse(data);
          resolve({
            rootTargetDefinition: target_definitions[0],
            returnValues: return_values,
          });
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
        reactNativePath: REACT_NATIVE_ROOT,
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

  it('returns relative path to a React Native location from source dir', () => {
    return run(runConfig).then(({returnValues}: RunResult) => {
      returnValues.forEach((rv) => {
        expect(rv.reactNativePath).toBe(
          path.relative(FIXTURES_ROOT, REACT_NATIVE_ROOT),
        );
      });
    });
  });

  describe('concerning platform specificity', () => {
    beforeEach(() => {
      addDependency(runConfig, 'macos-dep');
      addDependency(runConfig, 'ios-and-macos-dep');
    });

    it('only activates pods that support iOS in targets that target `ios`', () => {
      return run(runConfig).then(({rootTargetDefinition}: RunResult) => {
        expect(
          rootTargetDefinition.children.find(
            (target) => target.name === 'iOS Target',
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
      return run(runConfig).then(({rootTargetDefinition}: RunResult) => {
        expect(
          rootTargetDefinition.children.find(
            (target) => target.name === 'macOS Target',
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
    return run(runConfig).then(({rootTargetDefinition}: RunResult) => {
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
    return run(runConfig).then(({rootTargetDefinition}: RunResult) => {
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

  it('prints out the native module pods that were found', () => {
    runConfig.captureStdout = true;
    addDependency(runConfig, 'ios-and-macos-dep');
    return run(runConfig).then((stdout) => {
      expect(stdout).toMatchInlineSnapshot(`
        "Auto-linking React Native modules for target \`iOS Target\`: ios-and-macos-dep and ios-dep
        Auto-linking React Native module for target \`macOS Target\`: ios-and-macos-dep"
      `);
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
      return run(runConfig).then(({rootTargetDefinition}: RunResult) => {
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
      return run(runConfig).then(({rootTargetDefinition}: RunResult) => {
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
