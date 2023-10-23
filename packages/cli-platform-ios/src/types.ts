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

export interface IosInfo {
  name: string;
  schemes?: string[];
  configurations?: string[];
  targets?: string[];
}
