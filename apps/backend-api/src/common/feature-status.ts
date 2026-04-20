export type FeatureStatus = {
  module: string;
  status: 'foundation-ready';
  notes: string[];
};

export function createFeatureStatus(module: string, notes: string[]): FeatureStatus {
  return {
    module,
    status: 'foundation-ready',
    notes
  };
}
