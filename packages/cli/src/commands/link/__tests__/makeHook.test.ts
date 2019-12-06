import makeHook from '../makeHook';

afterAll(() => {
  jest.restoreAllMocks();
});

describe('makeHook', () => {
  it('invokes the command', async () => {
    const hook = makeHook('echo');
    const result = await hook();
    expect(result.cmd).toBe('echo');
  });

  it('invokes the command with multiple arguments', async () => {
    const hook = makeHook('node -p "1;"');
    const result = await hook();
    expect(result.cmd).toBe('node -p "1;"');
  });
});
