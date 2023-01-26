export interface Device {
  availability?: string;
  state?: string;
  isAvailable?: boolean;
  name: string;
  udid: string;
  version?: string;
  availabilityError?: string;
  type?: 'simulator' | 'device' | 'catalyst';
  booted?: boolean;
  lastBootedAt?: string;
}

export interface IosProjectInfo {
  configurations: string[];
  name: string;
  schemes: string[];
  targets: string[];
}
