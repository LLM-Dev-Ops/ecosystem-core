/**
 * LLM Ecosystem Core SDK
 * Provides programmatic access for downstream Layer-3 cores and Phase-9 platform
 *
 * This SDK is thin glue - all methods delegate to services/adapters
 */

import {
  MarketplaceItem,
  SearchQuery,
  SearchResult,
  BenchmarkResult,
  BenchmarkLeaderboard,
  EcosystemMetrics,
  AnalyticsTrend,
} from './types';

/**
 * Artifact summary aggregating metadata by type
 */
export interface ArtifactSummary {
  totalCount: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  recentlyAdded: MarketplaceItem[];
  lastUpdated: Date;
}

/**
 * Benchmark metadata
 */
export interface BenchmarkMetadata {
  id: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Comparison result for multiple models
 */
export interface ComparisonResult {
  benchmarkId: string;
  benchmarkName?: string;
  models: Array<{
    modelId: string;
    modelName?: string;
    score: number;
    rank?: number;
    metadata?: Record<string, any>;
  }>;
  comparedAt: Date;
}

/**
 * Usage statistics for artifacts (SDK layer)
 */
export interface SDKUsageStats {
  artifactId?: string;
  downloads: number;
  views: number;
  activeUsers: number;
  period: string;
  breakdown?: Record<string, number>;
  lastUpdated: Date;
}

/**
 * Ecosystem overview
 */
export interface EcosystemOverview {
  totalArtifacts: number;
  totalModels: number;
  totalBenchmarks: number;
  activeContributors: number;
  recentActivity: Array<{
    type: string;
    artifactId: string;
    artifactName: string;
    timestamp: Date;
  }>;
  summary: string;
  lastUpdated: Date;
}

/**
 * Trending artifacts
 */
export interface TrendingArtifacts {
  trending: MarketplaceItem[];
  period: string;
  criteria: string;
  lastUpdated: Date;
}

/**
 * Correlated insights across artifacts
 */
export interface CorrelatedInsights {
  artifacts: string[];
  commonPatterns: Array<{
    pattern: string;
    occurrences: number;
    affectedArtifacts: string[];
  }>;
  recommendations: Array<{
    type: string;
    description: string;
    relevantArtifacts: string[];
  }>;
  correlations: Array<{
    artifactId1: string;
    artifactId2: string;
    correlationType: string;
    strength: number;
  }>;
  generatedAt: Date;
}

/**
 * SDK Marketplace client interface for artifact operations
 */
export interface ISDKMarketplaceClient {
  list(query?: SearchQuery): Promise<SearchResult<MarketplaceItem>>;
  search(query: string): Promise<SearchResult<MarketplaceItem>>;
  get(id: string): Promise<MarketplaceItem | null>;
  summarize(type?: string): Promise<ArtifactSummary>;
}

/**
 * SDK Analytics client interface for metrics and trends
 */
export interface ISDKAnalyticsClient {
  getMetrics(): Promise<EcosystemMetrics>;
  getTrends(metric: string, period?: string): Promise<AnalyticsTrend[]>;
  getUsage(artifactId?: string): Promise<SDKUsageStats>;
}

/**
 * SDK Benchmark client interface for model evaluation
 */
export interface ISDKBenchmarkClient {
  listBenchmarks(): Promise<BenchmarkMetadata[]>;
  getLeaderboard(benchmarkId: string): Promise<BenchmarkLeaderboard>;
  getModelRankings(modelId: string): Promise<BenchmarkResult[]>;
  compareModels(modelIds: string[], benchmarkId: string): Promise<ComparisonResult>;
}

/**
 * Configuration for the Ecosystem SDK
 */
export interface EcosystemConfig {
  marketplaceClient: ISDKMarketplaceClient;
  analyticsClient: ISDKAnalyticsClient;
  benchmarkClient: ISDKBenchmarkClient;
}

/**
 * Main SDK class providing access to all ecosystem operations
 *
 * This class is thin glue that delegates to the appropriate client/service.
 * It provides a clean, organized API surface for downstream consumers.
 */
export class EcosystemSDK {
  private config: EcosystemConfig;

  constructor(config: EcosystemConfig) {
    this.config = config;
  }

  /**
   * Artifact operations - delegates to MarketplaceClient
   */
  public artifacts = {
    /**
     * List artifacts with optional query parameters
     */
    list: async (query?: SearchQuery): Promise<SearchResult<MarketplaceItem>> => {
      return this.config.marketplaceClient.list(query);
    },

    /**
     * Search artifacts by query string
     */
    search: async (query: string): Promise<SearchResult<MarketplaceItem>> => {
      return this.config.marketplaceClient.search(query);
    },

    /**
     * Get a specific artifact by ID
     */
    get: async (id: string): Promise<MarketplaceItem | null> => {
      return this.config.marketplaceClient.get(id);
    },

    /**
     * Get artifact summary, optionally filtered by type
     */
    summarize: async (type?: string): Promise<ArtifactSummary> => {
      return this.config.marketplaceClient.summarize(type);
    },
  };

  /**
   * Benchmark operations - delegates to BenchmarkClient
   */
  public benchmarks = {
    /**
     * List all available benchmarks
     */
    list: async (): Promise<BenchmarkMetadata[]> => {
      return this.config.benchmarkClient.listBenchmarks();
    },

    /**
     * Get leaderboard for a specific benchmark
     */
    leaderboard: async (benchmarkId: string): Promise<BenchmarkLeaderboard> => {
      return this.config.benchmarkClient.getLeaderboard(benchmarkId);
    },

    /**
     * Get rankings for a specific model across benchmarks
     */
    rankings: async (modelId: string): Promise<BenchmarkResult[]> => {
      return this.config.benchmarkClient.getModelRankings(modelId);
    },

    /**
     * Compare multiple models on a specific benchmark
     */
    compare: async (modelIds: string[], benchmarkId: string): Promise<ComparisonResult> => {
      return this.config.benchmarkClient.compareModels(modelIds, benchmarkId);
    },
  };

  /**
   * Analytics operations - delegates to AnalyticsClient
   */
  public analytics = {
    /**
     * Get ecosystem-wide metrics
     */
    metrics: async (): Promise<EcosystemMetrics> => {
      return this.config.analyticsClient.getMetrics();
    },

    /**
     * Get trend data for a specific metric
     */
    trends: async (metric: string, period?: string): Promise<AnalyticsTrend[]> => {
      return this.config.analyticsClient.getTrends(metric, period);
    },

    /**
     * Get usage statistics, optionally for a specific artifact
     */
    usage: async (artifactId?: string): Promise<SDKUsageStats> => {
      return this.config.analyticsClient.getUsage(artifactId);
    },
  };

  /**
   * Ecosystem-wide operations
   *
   * These operations orchestrate multiple clients to provide
   * higher-level ecosystem insights
   */
  public ecosystem = {
    /**
     * Get ecosystem overview
     * Aggregates data from multiple sources
     */
    overview: async (): Promise<EcosystemOverview> => {
      // Orchestrate calls to multiple clients
      const [metrics, artifacts] = await Promise.all([
        this.config.analyticsClient.getMetrics(),
        this.config.marketplaceClient.list({
          query: '',
          pagination: { page: 1, pageSize: 10 },
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }),
      ]);

      const benchmarks = await this.config.benchmarkClient.listBenchmarks();

      return {
        totalArtifacts: metrics.usage.totalArtifacts,
        totalModels: artifacts.items.filter(item => item.type === 'model').length,
        totalBenchmarks: benchmarks.length,
        activeContributors: metrics.usage.activeUsers,
        recentActivity: artifacts.items.slice(0, 5).map(item => ({
          type: 'artifact_added',
          artifactId: item.id,
          artifactName: item.name,
          timestamp: item.createdAt,
        })),
        summary: `Ecosystem contains ${metrics.usage.totalArtifacts} artifacts with ${metrics.usage.totalDownloads} total downloads`,
        lastUpdated: new Date(),
      };
    },

    /**
     * Get trending artifacts
     */
    trending: async (): Promise<TrendingArtifacts> => {
      // Get artifacts sorted by recent downloads/popularity
      const result = await this.config.marketplaceClient.list({
        query: '',
        pagination: { page: 1, pageSize: 20 },
        sortBy: 'downloads',
        sortOrder: 'desc',
      });

      return {
        trending: result.items,
        period: 'last_7_days',
        criteria: 'downloads',
        lastUpdated: new Date(),
      };
    },

    /**
     * Get correlated insights across multiple artifacts
     */
    insights: async (artifactIds: string[]): Promise<CorrelatedInsights> => {
      // Fetch all artifacts
      const artifacts = await Promise.all(
        artifactIds.map(id => this.config.marketplaceClient.get(id))
      );

      const validArtifacts = artifacts.filter((a): a is MarketplaceItem => a !== null);

      // Analyze patterns
      const typeCount = validArtifacts.reduce((acc, artifact) => {
        acc[artifact.type] = (acc[artifact.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const tagCount = validArtifacts.reduce((acc, artifact) => {
        artifact.tags?.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const commonPatterns = Object.entries(typeCount)
        .map(([pattern, occurrences]) => ({
          pattern: `type:${pattern}`,
          occurrences,
          affectedArtifacts: validArtifacts
            .filter(a => a.type === pattern)
            .map(a => a.id),
        }))
        .concat(
          Object.entries(tagCount)
            .filter(([_, count]) => count > 1)
            .map(([pattern, occurrences]) => ({
              pattern: `tag:${pattern}`,
              occurrences,
              affectedArtifacts: validArtifacts
                .filter(a => a.tags?.includes(pattern))
                .map(a => a.id),
            }))
        );

      const recommendations = commonPatterns
        .filter(p => p.occurrences > 1)
        .map(p => ({
          type: 'common_pattern',
          description: `${p.occurrences} artifacts share ${p.pattern}`,
          relevantArtifacts: p.affectedArtifacts,
        }));

      return {
        artifacts: artifactIds,
        commonPatterns,
        recommendations,
        correlations: [],
        generatedAt: new Date(),
      };
    },
  };
}

/**
 * Factory function to create an EcosystemSDK instance
 *
 * @param config - Configuration with client instances
 * @returns Configured EcosystemSDK instance
 *
 * @example
 * ```typescript
 * const sdk = createEcosystemSDK({
 *   marketplaceClient: new MyMarketplaceClient(),
 *   analyticsClient: new MyAnalyticsClient(),
 *   benchmarkClient: new MyBenchmarkClient(),
 * });
 *
 * // Use the SDK
 * const artifacts = await sdk.artifacts.list();
 * const metrics = await sdk.analytics.metrics();
 * ```
 */
export function createEcosystemSDK(config: EcosystemConfig): EcosystemSDK {
  return new EcosystemSDK(config);
}
