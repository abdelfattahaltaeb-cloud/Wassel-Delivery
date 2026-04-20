export type AppEnvironment = 'local' | 'staging' | 'production';

export type PlatformDomainMap = {
  primary: string;
  api: string;
  admin: string;
  tracking: string;
};

export type BuildInfo = {
  appName: string;
  version: string;
  environment: AppEnvironment | string;
  commitSha: string;
  builtAt: string;
};

export type FeatureStatus = {
  module: string;
  status: 'planned' | 'foundation-ready';
  notes: string[];
};
