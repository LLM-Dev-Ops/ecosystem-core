/**
 * Adapters for LLM Ecosystem Core
 * Adapters provide thin glue to external systems and data sources
 */

// Marketplace Adapter
export {
  IMarketplaceAdapter,
  IMarketplaceClient,
  MarketplaceAdapter,
  createMarketplaceAdapter,
} from './marketplace.adapter';

// Analytics Adapter
export {
  IAnalyticsAdapter,
  IAnalyticsClient,
  AnalyticsAdapter,
  createAnalyticsAdapter,
  UsageStats,
  CorrelationResult,
} from './analytics.adapter';

// Benchmark Adapter
export {
  IBenchmarkAdapter,
  BenchmarkAdapter,
  createBenchmarkAdapter,
} from './benchmark.adapter';
