import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class AuthService {
  getFoundationStatus() {
    return createFeatureStatus('auth', [
      'Authentication boundaries are reserved for standalone identity flows.',
      'No existing Wassel auth provider or token setup is reused.'
    ]);
  }
}
