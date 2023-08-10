import {CLIError, logger} from '@react-native-community/cli-tools';

const CTRL_C = '\u0003';

/** An abstract key stroke interceptor. */
export class KeyPressHandler {
  private isInterceptingKeyStrokes = false;
  private isHandlingKeyPress = false;

  constructor(public onPress: (key: string) => Promise<any>) {}

  /** Start observing interaction pause listeners. */
  createInteractionListener() {
    // Support observing prompts.
    let wasIntercepting = false;

    const listener = ({pause}: {pause: boolean}) => {
      if (pause) {
        // Track if we were already intercepting key strokes before pausing, so we can
        // resume after pausing.
        wasIntercepting = this.isInterceptingKeyStrokes;
        this.stopInterceptingKeyStrokes();
      } else if (wasIntercepting) {
        // Only start if we were previously intercepting.
        this.startInterceptingKeyStrokes();
      }
    };

    return listener;
  }

  private handleKeypress = async (key: string) => {
    // Prevent sending another event until the previous event has finished.
    if (this.isHandlingKeyPress && key !== CTRL_C) {
      return;
    }
    this.isHandlingKeyPress = true;
    try {
      logger.debug(`Key pressed: ${key}`);
      await this.onPress(key);
    } catch (error) {
      return new CLIError(
        'There was an error with the key press handler.',
        (error as Error).message,
      );
    } finally {
      this.isHandlingKeyPress = false;
      return;
    }
  };

  /** Start intercepting all key strokes and passing them to the input `onPress` method. */
  startInterceptingKeyStrokes() {
    if (this.isInterceptingKeyStrokes) {
      return;
    }
    this.isInterceptingKeyStrokes = true;
    const {stdin} = process;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', this.handleKeypress);
  }

  /** Stop intercepting all key strokes. */
  stopInterceptingKeyStrokes() {
    if (!this.isInterceptingKeyStrokes) {
      return;
    }
    this.isInterceptingKeyStrokes = false;
    const {stdin} = process;
    stdin.removeListener('data', this.handleKeypress);
    stdin.setRawMode(false);
    stdin.resume();
  }
}
