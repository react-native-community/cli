import prompts, {Options, PromptObject} from 'prompts';
import {CLIError} from './errors';
import logger from './logger';

type PromptOptions = {nonInteractiveHelp?: string} & Options;
type InteractionOptions = {pause: boolean; canEscape?: boolean};
type InteractionCallback = (options: InteractionOptions) => void;

/** Interaction observers for detecting when keystroke tracking should pause/resume. */
const listeners: InteractionCallback[] = [];

export async function prompt(
  question: PromptObject,
  options: PromptOptions = {},
) {
  pauseInteractions();
  try {
    const results = await prompts(question, {
      onCancel() {
        throw new CLIError('Prompt cancelled.');
      },
      ...options,
    });

    return results;
  } finally {
    resumeInteractions();
  }
}

export function pauseInteractions(
  options: Omit<InteractionOptions, 'pause'> = {},
) {
  logger.debug('Interaction observers paused');
  for (const listener of listeners) {
    listener({pause: true, ...options});
  }
}

/** Notify all listeners that keypress observations can start.. */
export function resumeInteractions(
  options: Omit<InteractionOptions, 'pause'> = {},
) {
  logger.debug('Interaction observers resumed');
  for (const listener of listeners) {
    listener({pause: false, ...options});
  }
}

/** Used to pause/resume interaction observers while prompting (made for TerminalUI). */
export function addInteractionListener(callback: InteractionCallback) {
  listeners.push(callback);
}
