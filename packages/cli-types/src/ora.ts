/**
 * The types exported from here are all from the Ora package.
 * Alternatively we could make this pacakge depend on the Ora
 * pacakge just to export the actual types.
 *
 * If these types are ever out of sync with the actual types
 * provided by Ora, the build of the CLI will break since we
 * assign Ora objects to objects of these types
 */

interface Spinner {
  readonly interval?: number;
  readonly frames: string[];
}

type Color =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray';

// Not the full list, but should be compatible with the real Ora type
type SpinnerName = any;

interface PersistOptions {
  /**
    Symbol to replace the spinner with.

    @default ' '
    */
  readonly symbol?: string;

  /**
    Text to be persisted after the symbol. Default: Current `text`.
    */
  readonly text?: string;

  /**
    Text to be persisted before the symbol. Default: Current `prefixText`.
    */
  readonly prefixText?: string;
}

export interface Ora {
  /**
    A boolean of whether the instance is currently spinning.
    */
  readonly isSpinning: boolean;

  /**
    Change the text after the spinner.
    */
  text: string;

  /**
    Change the text before the spinner.
    */
  prefixText: string;

  /**
    Change the spinner color.
    */
  color: Color;

  /**
    Change the spinner.
    */
  spinner: SpinnerName | Spinner;

  /**
    Change the spinner indent.
    */
  indent: number;

  /**
    Start the spinner.

    @param text - Set the current text.
    @returns The spinner instance.
    */
  start(text?: string): Ora;

  /**
    Stop and clear the spinner.

    @returns The spinner instance.
    */
  stop(): Ora;

  /**
    Stop the spinner, change it to a green `✔` and persist the current text, or `text` if provided.

    @param text - Will persist text if provided.
    @returns The spinner instance.
    */
  succeed(text?: string): Ora;

  /**
    Stop the spinner, change it to a red `✖` and persist the current text, or `text` if provided.

    @param text - Will persist text if provided.
    @returns The spinner instance.
    */
  fail(text?: string): Ora;

  /**
    Stop the spinner, change it to a yellow `⚠` and persist the current text, or `text` if provided.

    @param text - Will persist text if provided.
    @returns The spinner instance.
    */
  warn(text?: string): Ora;

  /**
    Stop the spinner, change it to a blue `ℹ` and persist the current text, or `text` if provided.

    @param text - Will persist text if provided.
    @returns The spinner instance.
    */
  info(text?: string): Ora;

  /**
    Stop the spinner and change the symbol or text.

    @returns The spinner instance.
    */
  stopAndPersist(options?: PersistOptions): Ora;

  /**
    Clear the spinner.

    @returns The spinner instance.
    */
  clear(): Ora;

  /**
    Manually render a new frame.

    @returns The spinner instance.
    */
  render(): Ora;

  /**
    Get a new frame.

    @returns The spinner instance.
    */
  frame(): Ora;
}
