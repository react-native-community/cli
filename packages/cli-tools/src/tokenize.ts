import {CLIError} from './errors';

// Inside double quotes a backslash keeps its escaping power only before one of
// these characters. Before anything else the backslash is a literal character.
const DOUBLE_QUOTE_ESCAPABLE = new Set(['"', '\\', '$', '`', '\n']);

/**
 * Splits a command-line string into arguments the way a POSIX shell would when
 * building the `argv` it hands to a program. Only quoting, backslash escaping
 * and whitespace splitting are applied — there is no expansion phase, so
 * variables (`$FOO`), command substitution (`$(...)`), globs (`*`) and operators
 * (`;`, `|`) are passed through verbatim for xcodebuild/gradle to interpret.
 *
 * - Unquoted whitespace separates arguments; adjacent quoted and unquoted
 *   segments join into one argument (`a"b"c` -> `abc`).
 * - Single quotes are fully literal (backslashes included).
 * - Double quotes are literal except a backslash escaping `"`, `\`, `$`, `` ` ``
 *   or a newline; any other backslash is kept.
 * - Outside quotes a backslash escapes the next character (`My\ App`); before a
 *   newline it is a line continuation.
 * - `""`/`''` produce an empty argument; empty input produces `[]`.
 * - An unterminated quote throws a {@link CLIError}.
 *
 * On Windows the backslash is a path separator, so escaping is disabled there
 * and paths such as `C:\keys\app.jks` survive unquoted; quoting and splitting
 * still apply.
 */
export default function tokenize(input: string): string[] {
  const backslashIsEscape = process.platform !== 'win32';

  const args: string[] = [];
  let arg = '';
  // Distinguishes "no argument yet" from "an argument that is empty" (e.g. the
  // `""` in `--flag ""`), which must be preserved.
  let hasArg = false;
  let quote: '"' | "'" | undefined;

  const append = (char: string) => {
    arg += char;
    hasArg = true;
  };

  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    const next = input[index + 1];

    // Single quotes: literal until the closing quote.
    if (quote === "'") {
      if (char === "'") {
        quote = undefined;
      } else {
        append(char);
      }

      continue;
    }

    // Double quotes: literal, plus a limited set of backslash escapes.
    if (quote === '"') {
      if (char === '"') {
        quote = undefined;
      } else if (
        char === '\\' &&
        backslashIsEscape &&
        DOUBLE_QUOTE_ESCAPABLE.has(next)
      ) {
        if (next !== '\n') {
          append(next);
        } // "\<newline>" is a line continuation
        index++;
      } else {
        append(char);
      }

      continue;
    }

    // Outside any quotes.
    if (char === '"' || char === "'") {
      quote = char;
      hasArg = true; // an opening quote starts an argument, even an empty one
    } else if (char === '\\' && backslashIsEscape && next !== undefined) {
      if (next !== '\n') {
        append(next);
      } // "\<newline>" is a line continuation

      index++;
    } else if (/\s/.test(char)) {
      if (hasArg) {
        args.push(arg);
      }

      arg = '';
      hasArg = false;
    } else {
      append(char);
    }
  }

  if (quote) {
    throw new CLIError(`Unterminated ${quote} quote in: ${input}`);
  }

  if (hasArg) {
    args.push(arg);
  }

  return args;
}
