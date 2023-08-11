export interface Device {
  name: string;
  udid: string;
  state?: string;
  availability?: string;
  isAvailable?: boolean;
  version?: string;
  availabilityError?: string;
  type?: 'simulator' | 'device' | 'catalyst';
  lastBootedAt?: string;
}

export interface IosProjectInfo {
  configurations: string[];
  name: string;
  schemes: string[];
  targets: string[];
}
