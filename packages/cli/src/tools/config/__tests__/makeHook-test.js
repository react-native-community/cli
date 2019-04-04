/**
 * @flow
 */
import makeHook from '../makeHook';

let spawnError = false;

jest.setMock('child_process', {
  spawn: () => ({
    on: (event, cb) => cb(spawnError),
  }),
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('makeHook', () => {
  const hook = makeHook('echo');

  it('generates a function around shell command', () => {
    expect(typeof hook).toBe('function');
  });

  it('throws an error if there is no callback provided', () => {
    expect(hook).toThrow();
  });

  it('invokes a callback after command execution', () => {
    const spy = jest.fn();
    hook(spy);
    expect(spy.mock.calls).toHaveLength(1);
  });

  it('throws an error if spawn ended up with error', () => {
    spawnError = true;
    const cb = jest.fn();
    expect(() => {
      hook(cb);
    }).toThrow();
  });
});
