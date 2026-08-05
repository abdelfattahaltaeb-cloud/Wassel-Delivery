type RuntimeModeInput = Record<string, unknown>;

export const lowCostModeEnvVar = 'LOW_COST_MODE';

function isEnabled(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function isLowCostModeEnabled(input: RuntimeModeInput = process.env) {
  return isEnabled(input[lowCostModeEnvVar]);
}
