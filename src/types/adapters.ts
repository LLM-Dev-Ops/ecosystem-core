/**
 * Re-export adapter interfaces from adapter modules
 * This provides a single import point for all adapter interfaces
 */

// Adapter interfaces are defined in their respective adapter modules
// and already exported from src/adapters/index.ts
// We re-export only the public adapter interfaces here for convenience
export type { IMarketplaceAdapter } from '../adapters/marketplace.adapter';
export type { IAnalyticsAdapter } from '../adapters/analytics.adapter';
export type { IBenchmarkAdapter } from '../adapters/benchmark.adapter';
