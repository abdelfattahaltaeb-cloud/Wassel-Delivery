export const platformName = 'Wassel Delivery';

export const platformDomains = {
  primary: 'wassel.net.ly',
  api: 'api.wassel.net.ly',
  admin: 'admin.wassel.net.ly',
  tracking: 'track.wassel.net.ly'
} as const;

export const defaultLocale = 'ar';

export const runtimeEnvironments = ['local', 'staging', 'production'] as const;
