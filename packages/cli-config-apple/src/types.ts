import {supportedPlatforms} from './config/supportedPlatforms';

type ObjectValues<T> = T[keyof T];

export type ApplePlatform = ObjectValues<typeof supportedPlatforms>;

export interface BuilderCommand {
  /**
   * Lowercase name of the platform.
   * Example: 'ios', 'visionos'
   */
  platformName: ApplePlatform;
}
