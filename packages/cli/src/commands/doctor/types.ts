import {RunAutomaticFix, NotFound} from '@react-native-community/cli-types';

export type HealthCheckResult = {
  label: string;
  needsToBeFixed: boolean;
  version?: NotFound | string;
  versions?: [string] | string;
  versionRange?: string;
  description: string | undefined;
  runAutomaticFix: RunAutomaticFix;
  isRequired: boolean;
  type?: string;
};

export type HealthCheckCategoryResult = {
  label: string;
  healthchecks: HealthCheckResult[];
};
