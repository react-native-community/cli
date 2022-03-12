import commander from 'commander';
import {attachCommand} from '../index';

jest.mock('@react-native-community/cli-config', () => ({
  commands: [],
}));

describe('attachCommand', () => {
  it('should not pass verbose flag to sub-commands with their own verbose flag, given flag not set', () => {
    const commandFunction = jest.fn();
    const command = {
      name: 'command-with-verbose-option',
      func: commandFunction,
      options: [
        {name: '--verbose'},
        {name: '--other-option-set'},
        {name: '--other-option-not-set'},
      ],
    };
    attachCommand(command);

    const argv = [
      'node',
      'index.ts',
      'command-with-verbose-option',
      '--other-option-set',
    ];
    commander.parse(argv);

    expect(commandFunction).toBeCalledWith(expect.any(Object), undefined, {
      verbose: undefined,
      otherOptionSet: true,
      otherOptionNotSet: undefined,
    });
  });

  it('should pass verbose flag to sub-commands with their own verbose flag, given flag set', () => {
    const commandFunction = jest.fn();
    const command = {
      name: 'command-with-verbose-option',
      func: commandFunction,
      options: [
        {name: '--verbose'},
        {name: '--other-option-set'},
        {name: '--other-option-not-set'},
      ],
    };
    attachCommand(command);

    const argv = [
      'node',
      'index.ts',
      'command-with-verbose-option',
      '--verbose',
      '--other-option-set',
    ];
    commander.parse(argv);

    expect(commandFunction).toBeCalledWith(expect.any(Object), undefined, {
      verbose: true,
      otherOptionSet: true,
      otherOptionNotSet: undefined,
    });
  });

  it('should not pass verbose flag to sub-commands without their own verbose flag, given flag set', () => {
    const commandFunction = jest.fn();
    const command = {
      name: 'command-without-verbose-option',
      func: commandFunction,
      options: [{name: '--other-option-set'}, {name: '--other-option-not-set'}],
    };
    attachCommand(command);

    const argv = [
      'node',
      'index.ts',
      'command-without-verbose-option',
      '--verbose',
      '--other-option-set',
    ];
    commander.parse(argv);

    expect(commandFunction).toBeCalledWith(expect.any(Object), undefined, {
      otherOptionSet: true,
      otherOptionNotSet: undefined,
    });
    expect(commandFunction.mock.calls[0][2]).not.toHaveProperty('verbose');
  });
});
