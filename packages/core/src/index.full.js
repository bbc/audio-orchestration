/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import { setDefaultSyncAdapterClass } from './orchestration/OrchestrationClient';
import CloudSyncAdapter from './sync-adapters/CloudSyncAdapter';

setDefaultSyncAdapterClass(CloudSyncAdapter);

export * from './index.light.js';
export {
  CloudSyncAdapter,
};
