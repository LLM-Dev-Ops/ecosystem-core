/**
 * LLM Ecosystem Core - Main Library Entry Point
 *
 * This is the primary entry point for the LLM-Ecosystem-Core library.
 * It re-exports all public APIs, types, adapters, services, and SDK components.
 */

// ============================================================================
// Type exports
// ============================================================================
export * from './types';

// ============================================================================
// Adapter exports
// ============================================================================
export {
  IMarketplaceAdapter,
  MarketplaceAdapter,
  createMarketplaceAdapter,
} from './adapters/marketplace.adapter';

export {
  IAnalyticsAdapter,
  AnalyticsAdapter,
  createAnalyticsAdapter,
} from './adapters/analytics.adapter';

export {
  IBenchmarkAdapter,
  BenchmarkAdapter,
  createBenchmarkAdapter,
} from './adapters/benchmark.adapter';

// ============================================================================
// Service exports
// ============================================================================
export {
  ArtifactService,
  BenchmarkService,
  EcosystemService,
} from './services';

// ============================================================================
// SDK exports
// ============================================================================
export {
  EcosystemSDK,
  createEcosystemSDK,
  EcosystemConfig,
} from './sdk';

// ============================================================================
// Version
// ============================================================================
export const VERSION = '1.0.0';
