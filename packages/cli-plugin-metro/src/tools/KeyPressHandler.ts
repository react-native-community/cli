import {
  CLIError,
  addInteractionListener,
  logger,
} from '@react-native-community/cli-tools';

/** An abstract key stroke interceptor. */
export class KeyPressHandler {
  private isInterceptingKeyStrokes = false;

  constructor(public onPress: (key: string) => void) {}

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

    addInteractionListener(listener);
  }

  private handleKeypress = async (key: string) => {
    try {
      logger.debug(`Key pressed: ${key}`);
      this.onPress(key);
    } catch (error) {
      return new CLIError(
        'There was an error with the key press handler.',
        (error as Error).message,
      );
    } finally {
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
