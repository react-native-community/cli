/**
 * A custom Error that creates a single-lined message to match current styling inside CLI.
 * Uses original stack trace when `originalError` is passed or erase the stack if it's not defined.
 */
export class CLIError extends Error {
  constructor(msg: string, originalError?: Error | string) {
    super(inlineString(msg));
    if (originalError) {
      this.stack =
        typeof originalError === 'string'
          ? originalError
          : originalError.stack || ''.split('\n').slice(0, 2).join('\n');
    } else {
      // When the "originalError" is not passed, it means that we know exactly
      // what went wrong and provide means to fix it. In such cases showing the
      // stack is an unnecessary clutter to the CLI output, hence removing it.
      delete this.stack;
    }
  }
}

export const inlineString = (str: string) =>
  str.replace(/(\s{2,})/gm, ' ').trim();
