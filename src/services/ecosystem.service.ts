/**
 * EcosystemService - Thin glue service for ecosystem-wide operations
 * Coordinates multiple adapters to provide aggregated insights
 */

import { EcosystemMetrics, TopArtifact, AnalyticsTrend } from '../types';
import { IMarketplaceAdapter } from '../adapters/marketplace.adapter';
import { IAnalyticsAdapter } from '../adapters/analytics.adapter';
import {
  IBenchmarkAdapter,
  BenchmarkMetadata,
  RankingEntry,
} from '../adapters/benchmark.adapter';

/**
 * High-level ecosystem overview combining data from multiple sources (service layer)
 */
export interface ServiceEcosystemOverview {
  metrics: EcosystemMetrics;
  leaderboardCount: number;
  benchmarkCount: number;
  lastUpdated: Date;
}

/**
 * Trending artifact with combined marketplace and analytics data (service layer)
 */
export interface ServiceTrendingArtifact extends TopArtifact {
  trends?: AnalyticsTrend[];
}

/**
 * Correlated insights combining analytics and benchmark data (service layer)
 */
export interface ServiceCorrelatedInsights {
  artifactId: string;
  trends: AnalyticsTrend[];
  relatedBenchmarks: RankingEntry[];
}

/**
 * Platform-normalized data for Phase-9 consumption
 */
export interface PlatformData {
  overview: ServiceEcosystemOverview;
  trending: ServiceTrendingArtifact[];
  timestamp: Date;
}

/**
 * Ecosystem service that coordinates multiple adapters
 */
export class EcosystemService {
  constructor(
    private readonly marketplaceAdapter: IMarketplaceAdapter,
    private readonly analyticsAdapter: IAnalyticsAdapter,
    private readonly benchmarkAdapter: IBenchmarkAdapter
  ) {}

  /**
   * Get aggregated ecosystem overview from all adapters
   * Combines metrics from marketplace, analytics, and benchmarks
   */
  async getEcosystemOverview(): Promise<ServiceEcosystemOverview> {
    // Get list of benchmarks to calculate counts
    const benchmarks = await this.benchmarkAdapter.listBenchmarks();

    // Delegate to adapters in parallel
    const metrics = await this.analyticsAdapter.getEcosystemMetrics();

    return {
      metrics,
      leaderboardCount: benchmarks.length, // Each benchmark has a leaderboard
      benchmarkCount: benchmarks.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get trending artifacts by combining marketplace and analytics data
   * Delegates to analytics adapter for trending data, then enriches with trends
   */
  async getTrendingArtifacts(): Promise<ServiceTrendingArtifact[]> {
    // Get ecosystem metrics which includes top artifacts
    const metrics = await this.analyticsAdapter.getEcosystemMetrics();
    const topArtifacts = metrics.topArtifacts;

    // Get trends for each top artifact
    const trendsPromises = topArtifacts.map(async (artifact) => {
      try {
        // Get trends for this specific artifact
        const trends = await this.analyticsAdapter.getTrends(artifact.id, 'week');
        return { artifactId: artifact.id, trends };
      } catch (error) {
        return { artifactId: artifact.id, trends: [] };
      }
    });

    const artifactTrends = await Promise.all(trendsPromises);

    // Create a map of trends by artifact ID
    const trendsByArtifact = new Map<string, AnalyticsTrend[]>();
    for (const { artifactId, trends } of artifactTrends) {
      trendsByArtifact.set(artifactId, trends);
    }

    // Combine top artifacts with their trends
    return topArtifacts.map((artifact) => ({
      ...artifact,
      trends: trendsByArtifact.get(artifact.id),
    }));
  }

  /**
   * Get correlated insights for specific artifacts
   * Combines analytics trends with related benchmark data
   */
  async getCorrelatedInsights(artifactIds: string[]): Promise<ServiceCorrelatedInsights[]> {
    // For each artifact, get trends and benchmark data in parallel
    const insights = await Promise.all(
      artifactIds.map(async (artifactId) => {
        // Get trends for this artifact
        let trends: AnalyticsTrend[] = [];
        try {
          trends = await this.analyticsAdapter.getTrends(artifactId, 'month');
        } catch (error) {
          trends = [];
        }

        // Try to get benchmark rankings for the artifact (if it's a model)
        let relatedBenchmarks: RankingEntry[] = [];
        try {
          const results = await this.benchmarkAdapter.getBenchmarkResults(artifactId);
          relatedBenchmarks = results.map((result) => ({
            rank: result.rank || 0,
            modelId: result.modelId,
            score: result.score,
            metadata: result.metadata,
          }));
        } catch (error) {
          // Artifact might not be a model, or no benchmark data available
          relatedBenchmarks = [];
        }

        return {
          artifactId,
          trends,
          relatedBenchmarks,
        };
      })
    );

    return insights;
  }

  /**
   * Normalize ecosystem data for Phase-9 platform consumption
   * Aggregates and formats data in a standardized structure
   */
  async normalizeForPlatform(): Promise<PlatformData> {
    // Delegate to aggregation methods
    const [overview, trending] = await Promise.all([
      this.getEcosystemOverview(),
      this.getTrendingArtifacts(),
    ]);

    return {
      overview,
      trending,
      timestamp: new Date(),
    };
  }
}
