/**
 * Analytics Adapter for LLM-Analytics-Hub
 * THIN GLUE LOGIC ONLY - Delegates all operations to injected IAnalyticsClient
 * No analytics engine implementation, calculations, or aggregations
 */

import {
  EcosystemMetrics,
  AnalyticsTrend,
} from '../types/index.js';

/**
 * Usage statistics for artifacts
 */
export interface UsageStats {
  totalUsage: number;
  uniqueUsers: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  metadata?: Record<string, any>;
}

/**
 * Correlation analysis result
 */
export interface CorrelationResult {
  correlations: Array<{
    artifactPair: [string, string];
    coefficient: number;
    strength: 'strong' | 'moderate' | 'weak';
  }>;
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * External analytics client interface
 * Implementation provided by LLM-Analytics-Hub
 */
export interface IAnalyticsClient {
  /**
   * Fetch ecosystem-wide metrics
   */
  fetchEcosystemMetrics(): Promise<any>;

  /**
   * Fetch trend data for a specific metric
   */
  fetchTrends(metric: string, period: string): Promise<any>;

  /**
   * Fetch usage statistics for artifact(s)
   */
  fetchUsageStats(artifactId?: string): Promise<any>;

  /**
   * Perform correlation analysis on artifacts
   */
  analyzeCorrelation(artifactIds: string[]): Promise<any>;
}

/**
 * Analytics adapter interface
 * Defines ecosystem-facing contract
 */
export interface IAnalyticsAdapter {
  /**
   * Get aggregated ecosystem metrics
   */
  getEcosystemMetrics(): Promise<EcosystemMetrics>;

  /**
   * Get trend data for a specific metric over a time period
   */
  getTrends(metric: string, period: string): Promise<AnalyticsTrend[]>;

  /**
   * Get usage statistics for an artifact or entire ecosystem
   */
  getUsageStats(artifactId?: string): Promise<UsageStats>;

  /**
   * Analyze correlation between multiple artifacts
   */
  correlateUsage(artifactIds: string[]): Promise<CorrelationResult>;
}

/**
 * Analytics Adapter Implementation
 * DELEGATES ALL OPERATIONS to injected IAnalyticsClient
 * Normalizes responses to ecosystem types
 */
export class AnalyticsAdapter implements IAnalyticsAdapter {
  constructor(private readonly client: IAnalyticsClient) {}

  /**
   * Get ecosystem metrics by delegating to client and normalizing response
   */
  async getEcosystemMetrics(): Promise<EcosystemMetrics> {
    const rawMetrics = await this.client.fetchEcosystemMetrics();

    // Normalize to EcosystemMetrics type
    return {
      usage: {
        totalArtifacts: rawMetrics.usage?.totalArtifacts ?? 0,
        totalDownloads: rawMetrics.usage?.totalDownloads ?? 0,
        activeUsers: rawMetrics.usage?.activeUsers ?? 0,
        ...rawMetrics.usage,
      },
      trends: Array.isArray(rawMetrics.trends)
        ? rawMetrics.trends.map((trend: any) => this.normalizeTrend(trend))
        : [],
      topArtifacts: Array.isArray(rawMetrics.topArtifacts)
        ? rawMetrics.topArtifacts.map((artifact: any) => ({
            id: artifact.id ?? '',
            name: artifact.name ?? '',
            type: artifact.type ?? '',
            score: artifact.score ?? 0,
            metadata: artifact.metadata,
          }))
        : [],
      lastUpdated: rawMetrics.lastUpdated
        ? new Date(rawMetrics.lastUpdated)
        : new Date(),
    };
  }

  /**
   * Get trends by delegating to client and normalizing response
   */
  async getTrends(metric: string, period: string): Promise<AnalyticsTrend[]> {
    const rawTrends = await this.client.fetchTrends(metric, period);

    // Normalize to AnalyticsTrend array
    if (!Array.isArray(rawTrends)) {
      return [];
    }

    return rawTrends.map((trend: any) => this.normalizeTrend(trend));
  }

  /**
   * Get usage stats by delegating to client and normalizing response
   */
  async getUsageStats(artifactId?: string): Promise<UsageStats> {
    const rawStats = await this.client.fetchUsageStats(artifactId);

    // Normalize to UsageStats type
    return {
      totalUsage: rawStats.totalUsage ?? 0,
      uniqueUsers: rawStats.uniqueUsers ?? 0,
      trend: this.normalizeTrendDirection(rawStats.trend),
      metadata: rawStats.metadata,
    };
  }

  /**
   * Correlate usage by delegating to client and normalizing response
   */
  async correlateUsage(artifactIds: string[]): Promise<CorrelationResult> {
    const rawCorrelation = await this.client.analyzeCorrelation(artifactIds);

    // Normalize to CorrelationResult type
    return {
      correlations: Array.isArray(rawCorrelation.correlations)
        ? rawCorrelation.correlations.map((corr: any) => ({
            artifactPair: corr.artifactPair ?? ['', ''],
            coefficient: corr.coefficient ?? 0,
            strength: this.normalizeCorrelationStrength(corr.strength ?? corr.coefficient),
          }))
        : [],
      confidence: rawCorrelation.confidence ?? 0,
      metadata: rawCorrelation.metadata,
    };
  }

  /**
   * Normalize trend data from client response
   */
  private normalizeTrend(rawTrend: any): AnalyticsTrend {
    return {
      metric: rawTrend.metric ?? '',
      values: Array.isArray(rawTrend.values)
        ? rawTrend.values.map((v: any) => ({
            timestamp: new Date(v.timestamp),
            value: v.value ?? 0,
          }))
        : [],
      period: rawTrend.period ?? '',
      source: rawTrend.source ?? 'analytics-hub',
    };
  }

  /**
   * Normalize trend direction string
   */
  private normalizeTrendDirection(trend: any): 'increasing' | 'decreasing' | 'stable' {
    if (typeof trend === 'string') {
      const normalized = trend.toLowerCase();
      if (normalized === 'increasing' || normalized === 'up') return 'increasing';
      if (normalized === 'decreasing' || normalized === 'down') return 'decreasing';
    }
    return 'stable';
  }

  /**
   * Normalize correlation strength
   */
  private normalizeCorrelationStrength(
    strength: any
  ): 'strong' | 'moderate' | 'weak' {
    if (typeof strength === 'string') {
      const normalized = strength.toLowerCase();
      if (normalized === 'strong') return 'strong';
      if (normalized === 'moderate' || normalized === 'medium') return 'moderate';
      return 'weak';
    }

    // If numeric (coefficient), infer strength
    if (typeof strength === 'number') {
      const absValue = Math.abs(strength);
      if (absValue >= 0.7) return 'strong';
      if (absValue >= 0.4) return 'moderate';
      return 'weak';
    }

    return 'weak';
  }
}

/**
 * Factory function to create analytics adapter
 * @param client - Analytics client implementation (from LLM-Analytics-Hub)
 * @returns Configured analytics adapter instance
 */
export function createAnalyticsAdapter(
  client: IAnalyticsClient
): IAnalyticsAdapter {
  return new AnalyticsAdapter(client);
}
